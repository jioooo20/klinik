<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreMedicalRecordRequest;
use App\Http\Requests\UpdateMedicalRecordRequest;
use App\Models\Icd10Code;
use App\Models\MedicalRecord;
use App\Models\Patient;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Rekam medis digital (Phase 5 — KLK-023..KLK-027).
 *
 * Thin controller: validation lives in Form Requests, authorization in
 * MedicalRecordPolicy, and auditing in MedicalRecordObserver.
 */
class MedicalRecordController extends Controller
{
    /**
     * ICD-10 options for the React form, sourced from the seeded dataset
     * (EMR-06). Falls back to an empty list when the table has not been seeded.
     *
     * @return array<int, array{code: string, label: string}>
     */
    private function icd10Options(): array
    {
        return Icd10Code::query()
            ->orderBy('code')
            ->get(['code', 'name'])
            ->map(fn (Icd10Code $code): array => [
                'code' => $code->code,
                'label' => $code->name,
            ])
            ->all();
    }

    /**
     * Riwayat rekam medis per pasien, terbaru lebih dulu + filter tanggal (KLK-025).
     */
    public function index(Request $request, Patient $patient): Response
    {
        $this->authorize('viewAny', MedicalRecord::class);
        $this->authorize('view', $patient);

        $from = $request->query('from');
        $to = $request->query('to');

        $records = MedicalRecord::query()
            ->where('patient_id', $patient->id)
            ->with('doctor.user')
            ->when($from, fn ($query) => $query->whereDate('visited_at', '>=', $from))
            ->when($to, fn ($query) => $query->whereDate('visited_at', '<=', $to))
            ->orderByDesc('visited_at')
            ->paginate(15)
            ->withQueryString()
            ->through(fn (MedicalRecord $record) => [
                'id' => $record->id,
                'visited_at' => $record->visited_at?->toIso8601String(),
                'icd10_code' => $record->icd10_code,
                'assessment' => $record->assessment,
                'doctor' => $record->doctor?->user?->name,
            ]);

        return Inertia::render('MedicalRecords/Index', [
            'patient' => [
                'id' => $patient->id,
                'name' => $patient->name,
                'nik' => $patient->nik,
            ],
            'records' => $records,
            'filters' => ['from' => $from, 'to' => $to],
        ]);
    }

    /**
     * Form rekam medis baru (KLK-024).
     */
    public function create(Patient $patient): Response
    {
        $this->authorize('create', MedicalRecord::class);
        $this->authorize('view', $patient);

        return Inertia::render('MedicalRecords/Create', [
            'patient' => [
                'id' => $patient->id,
                'name' => $patient->name,
                'nik' => $patient->nik,
            ],
            'icd10Options' => $this->icd10Options(),
        ]);
    }

    /**
     * Simpan rekam medis baru (BR-05, BR-06, BR-10).
     */
    public function store(StoreMedicalRecordRequest $request, Patient $patient): RedirectResponse
    {
        $doctor = $request->user()->doctor;
        abort_if($doctor === null, 403, 'Akun dokter belum terhubung ke data dokter.');

        $data = $request->validated();

        $record = MedicalRecord::create([
            'clinic_id' => $request->user()->clinic_id,
            'patient_id' => $patient->id,
            'doctor_id' => $doctor->id,
            'appointment_id' => $data['appointment_id'] ?? null,
            'visited_at' => $data['visited_at'],
            'subjective' => $data['subjective'],
            'objective' => $data['objective'],
            'assessment' => $data['assessment'],
            'plan' => $data['plan'],
            'icd10_code' => $this->joinCodes($data['icd10_codes'] ?? []),
            'vitals' => $data['vitals'] ?? null,
            'prescription' => $this->parsePrescription($data['prescription'] ?? null),
        ]);

        return redirect()
            ->route('medical-records.show', $record)
            ->with('success', 'Rekam medis berhasil disimpan.');
    }

    /**
     * Detail satu rekam medis.
     */
    public function show(MedicalRecord $record): Response
    {
        $this->authorize('view', $record);
        $record->load('doctor.user', 'patient');

        return Inertia::render('MedicalRecords/Show', [
            'record' => [
                'id' => $record->id,
                'visited_at' => $record->visited_at?->toIso8601String(),
                'subjective' => $record->subjective,
                'objective' => $record->objective,
                'assessment' => $record->assessment,
                'plan' => $record->plan,
                'icd10_codes' => $this->splitCodes($record->icd10_code),
                'vitals' => $record->vitals,
                'prescription' => $this->normalizePrescription($record->prescription),
                'doctor' => $record->doctor?->user?->name,
            ],
            'patient' => [
                'id' => $record->patient?->id,
                'name' => $record->patient?->name,
                'nik' => $record->patient?->nik,
            ],
            'canUpdate' => Gate::allows('update', $record),
        ]);
    }

    /**
     * Form revisi rekam medis (KLK-024).
     */
    public function edit(MedicalRecord $record): Response
    {
        $this->authorize('update', $record);
        $record->load('patient');

        return Inertia::render('MedicalRecords/Edit', [
            'record' => [
                'id' => $record->id,
                'visited_at' => $record->visited_at?->toDateString(),
                'subjective' => $record->subjective,
                'objective' => $record->objective,
                'assessment' => $record->assessment,
                'plan' => $record->plan,
                'icd10_codes' => $this->splitCodes($record->icd10_code),
                'vitals' => $this->normalizeVitals($record->vitals),
                'prescription' => implode("\n", $this->normalizePrescription($record->prescription)),
            ],
            'patient' => [
                'id' => $record->patient?->id,
                'name' => $record->patient?->name,
                'nik' => $record->patient?->nik,
            ],
            'icd10Options' => $this->icd10Options(),
        ]);
    }

    /**
     * Perbarui rekam medis (immutable: revisi menimpa + jejak audit).
     */
    public function update(UpdateMedicalRecordRequest $request, MedicalRecord $record): RedirectResponse
    {
        $data = $request->validated();

        $record->update([
            'appointment_id' => $data['appointment_id'] ?? $record->appointment_id,
            'visited_at' => $data['visited_at'],
            'subjective' => $data['subjective'],
            'objective' => $data['objective'],
            'assessment' => $data['assessment'],
            'plan' => $data['plan'],
            'icd10_code' => $this->joinCodes($data['icd10_codes'] ?? []),
            'vitals' => $data['vitals'] ?? null,
            'prescription' => $this->parsePrescription($data['prescription'] ?? null),
        ]);

        return redirect()
            ->route('medical-records.show', $record)
            ->with('success', 'Rekam medis berhasil diperbarui.');
    }

    /**
     * BR-07: rekam medis tidak boleh dihapus permanen. Policy selalu false.
     */
    public function destroy(MedicalRecord $record): never
    {
        $this->authorize('delete', $record);

        abort(403, 'Rekam medis bersifat immutable dan tidak dapat dihapus.');
    }

    /**
     * Normalise prescription entries to plain drug-name strings.
     *
     * Seeded records store structured objects ({name, dose, frequency});
     * user-entered records store plain strings. Both shapes are flattened
     * to a list of names so the UI can render and edit them uniformly.
     *
     * @return array<int, string>
     */
    private function normalizePrescription(mixed $prescription): array
    {
        if (! is_array($prescription)) {
            return [];
        }

        $out = [];

        foreach ($prescription as $item) {
            if (is_string($item) && trim($item) !== '') {
                $out[] = $item;
            } elseif (is_array($item) && isset($item['name'])) {
                $out[] = (string) $item['name'];
            }
        }

        return $out;
    }

    /**
     * Coerce vitals to string values for HTML form inputs, filling any
     * missing key with an empty string. The seeder stores numeric values
     * for suhu/nadi while UpdateMedicalRecordRequest validates them as
     * strings, so normalisation here prevents silent 422 failures.
     *
     * @return array{tensi: string, suhu: string, nadi: string, respirasi: string}
     */
    private function normalizeVitals(mixed $vitals): array
    {
        $defaults = ['tensi' => '', 'suhu' => '', 'nadi' => '', 'respirasi' => ''];

        if (! is_array($vitals)) {
            return $defaults;
        }

        foreach ($defaults as $key => $default) {
            if (isset($vitals[$key])) {
                $defaults[$key] = (string) $vitals[$key];
            }
        }

        return $defaults;
    }

    /**
     * @param  array<int, string>  $codes
     */
    private function joinCodes(array $codes): ?string
    {
        $codes = array_values(array_filter(array_map('trim', $codes), fn ($code) => $code !== ''));

        return $codes === [] ? null : implode(',', $codes);
    }

    /**
     * @return array<int, string>
     */
    private function splitCodes(?string $codes): array
    {
        if ($codes === null || $codes === '') {
            return [];
        }

        return array_values(array_filter(array_map('trim', explode(',', $codes))));
    }

    /**
     * @return array<int, string>|null
     */
    private function parsePrescription(?string $text): ?array
    {
        if ($text === null || trim($text) === '') {
            return null;
        }

        return array_values(array_filter(array_map('trim', preg_split('/\r\n|\r|\n/', $text))));
    }
}
