<?php

namespace App\Http\Controllers;

use App\Http\Requests\StorePatientRequest;
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
