<?php

namespace App\Http\Controllers;

use App\Http\Requests\StorePatientRequest;
use App\Http\Requests\UpdateOwnPatientRequest;
use App\Http\Requests\UpdatePatientRequest;
use App\Models\Patient;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PatientController extends Controller
{
    /**
     * Display a paginated, searchable listing of patients (KLK-020).
     *
     * Search is server-side on name / NIK. The Patient model carries a
     * global clinic scope, so results are already tenant-limited.
     */
    public function index(Request $request): Response
    {
        $this->authorize('viewAny', Patient::class);

        $search = trim((string) $request->query('search', ''));

        $patients = Patient::query()
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'ilike', "%{$search}%")
                        ->orWhere('nik', 'ilike', "%{$search}%");
                });
            })
            ->orderBy('name')
            ->paginate(15)
            ->withQueryString()
            ->through(fn (Patient $patient) => [
                'id' => $patient->id,
                'nik' => $patient->nik,
                'name' => $patient->name,
                'date_of_birth' => $patient->date_of_birth?->toDateString(),
                'gender' => $patient->gender,
                'phone' => $patient->phone,
            ]);

        return Inertia::render('Patients/Index', [
            'patients' => $patients,
            'filters' => ['search' => $search],
        ]);
    }

    /**
     * Show the form for creating a new patient (KLK-021).
     */
    public function create(): Response
    {
        $this->authorize('create', Patient::class);

        return Inertia::render('Patients/Create');
    }

    /**
     * Persist a newly created patient, scoped to the actor's clinic.
     */
    public function store(StorePatientRequest $request): RedirectResponse
    {
        $patient = Patient::create([
            ...$request->validated(),
            'clinic_id' => $request->user()->clinic_id,
        ]);

        return redirect()
            ->route('patients.show', $patient)
            ->with('success', 'Pasien berhasil ditambahkan.');
    }

    /**
     * Display the patient detail with the Riwayat tab data (KLK-022).
     */
    public function show(Patient $patient): Response
    {
        $this->authorize('view', $patient);

        $patient->load([
            'appointments' => fn ($query) => $query->with('doctor.user')->latest('scheduled_at'),
            'medicalRecords' => fn ($query) => $query->with('doctor.user')->latest('visited_at'),
        ]);

        return Inertia::render('Patients/Show', [
            'patient' => [
                'id' => $patient->id,
                'nik' => $patient->nik,
                'name' => $patient->name,
                'date_of_birth' => $patient->date_of_birth?->toDateString(),
                'gender' => $patient->gender,
                'blood_type' => $patient->blood_type,
                'allergies' => $patient->allergies,
                'phone' => $patient->phone,
                'address' => $patient->address,
                'emergency_contact_name' => $patient->emergency_contact_name,
                'emergency_contact_phone' => $patient->emergency_contact_phone,
            ],
            'appointments' => $patient->appointments->map(fn ($appointment) => [
                'id' => $appointment->id,
                'scheduled_at' => $appointment->scheduled_at?->toIso8601String(),
                'status' => $appointment->status instanceof \BackedEnum
                    ? $appointment->status->value
                    : $appointment->status,
                'queue_number' => $appointment->queue_number,
                'complaint' => $appointment->complaint,
                'doctor' => $appointment->doctor?->user?->name,
            ]),
            'medicalRecords' => $patient->medicalRecords->map(fn ($record) => [
                'id' => $record->id,
                'visited_at' => $record->visited_at?->toIso8601String(),
                'icd10_code' => $record->icd10_code,
                'assessment' => $record->assessment,
                'doctor' => $record->doctor?->user?->name,
            ]),
        ]);
    }

    /**
     * Show the form for editing an existing patient (KLK-021).
     */
    public function edit(Patient $patient): Response
    {
        $this->authorize('update', $patient);

        return Inertia::render('Patients/Edit', [
            'patient' => [
                'id' => $patient->id,
                'nik' => $patient->nik,
                'name' => $patient->name,
                'date_of_birth' => $patient->date_of_birth?->toDateString(),
                'gender' => $patient->gender,
                'phone' => $patient->phone,
                'address' => $patient->address,
                'blood_type' => $patient->blood_type,
                'allergies' => $patient->allergies,
                'emergency_contact_name' => $patient->emergency_contact_name,
                'emergency_contact_phone' => $patient->emergency_contact_phone,
            ],
        ]);
    }

    /**
     * Update the specified patient.
     */
    public function update(UpdatePatientRequest $request, Patient $patient): RedirectResponse
    {
        $patient->update($request->validated());

        return redirect()
            ->route('patients.show', $patient)
            ->with('success', 'Data pasien berhasil diperbarui.');
    }

    /**
     * Show the pasien self-service profile form (Profil Saya).
     *
     * The patient row is resolved from the authenticated user, never from the
     * URL, so a pasien cannot target another patient's record.
     */
    public function editProfile(Request $request): Response|RedirectResponse
    {
        $patient = $this->resolveOwnPatient($request);

        if ($patient === null) {
            return redirect()
                ->route('dashboard.patient')
                ->with('error', 'Akun Anda belum tertaut ke data pasien. Hubungi admin klinik.');
        }

        $this->authorize('updateSelf', $patient);

        return Inertia::render('Profile/Edit', [
            'patient' => [
                'id' => $patient->id,
                'nik' => $patient->nik,
                'name' => $patient->name,
                'blood_type' => $patient->blood_type,
                'allergies' => $patient->allergies,
                'phone' => $patient->phone,
                'address' => $patient->address,
                'emergency_contact_name' => $patient->emergency_contact_name,
                'emergency_contact_phone' => $patient->emergency_contact_phone,
            ],
        ]);
    }

    /**
     * Persist the pasien self-service profile update (strict whitelist).
     */
    public function updateProfile(UpdateOwnPatientRequest $request): RedirectResponse
    {
        // The /profile route carries no {patient} parameter, so resolve the
        // row from the authenticated user — a pasien can never target another.
        $patient = $this->resolveOwnPatient($request);

        if ($patient === null) {
            return redirect()
                ->route('dashboard.patient')
                ->with('error', 'Akun Anda belum tertaut ke data pasien. Hubungi admin klinik.');
        }

        // Defence-in-depth: validated() already only contains the six
        // self-serviceable keys, but we whitelist again on write.
        $patient->update([
            'blood_type' => $request->validated('blood_type'),
            'allergies' => $request->validated('allergies'),
            'phone' => $request->validated('phone'),
            'address' => $request->validated('address'),
            'emergency_contact_name' => $request->validated('emergency_contact_name'),
            'emergency_contact_phone' => $request->validated('emergency_contact_phone'),
        ]);

        return redirect()
            ->route('profile.edit')
            ->with('success', 'Profil berhasil diperbarui.');
    }

    /**
     * Resolve the Patient row linked to the authenticated user.
     *
     * Uses withoutClinicScope() because a pasien's clinic_id may legitimately
     * differ from the session's default scope during cross-clinic flows.
     */
    private function resolveOwnPatient(Request $request): ?Patient
    {
        $user = $request->user();

        if ($user === null) {
            return null;
        }

        return Patient::forUser($user);
    }

    /**
     * Soft-delete the specified patient.
     */
    public function destroy(Patient $patient): RedirectResponse
    {
        $this->authorize('delete', $patient);

        $patient->delete();

        return redirect()
            ->route('patients.index')
            ->with('success', 'Pasien berhasil dihapus.');
    }
}
