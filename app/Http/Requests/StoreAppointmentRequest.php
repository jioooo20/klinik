<?php

namespace App\Http\Requests;

use App\Models\Appointment;
use App\Models\Doctor;
use App\Models\Patient;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreAppointmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('create', Appointment::class) ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $user = $this->user();
        $clinicId = $user->clinic_id;

        return [
            'doctor_id' => [
                'required',
                'integer',
                Rule::exists('doctors', 'id')->where('clinic_id', $clinicId),
            ],
            // Patients book for themselves; admin may pick any patient in-clinic.
            'patient_id' => $user->hasAppRole('admin')
                ? ['required', 'integer', Rule::exists('patients', 'id')->where('clinic_id', $clinicId)->whereNull('deleted_at')]
                : ['prohibited'],
            'scheduled_at' => ['required', 'date', 'after:now'],
            'complaint' => ['nullable', 'string', 'max:1000'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'doctor_id.required' => 'Dokter wajib dipilih.',
            'doctor_id.exists' => 'Dokter tidak tersedia di klinik ini.',
            'patient_id.required' => 'Pasien wajib dipilih.',
            'patient_id.exists' => 'Pasien tidak ditemukan di klinik ini.',
            'patient_id.prohibited' => 'Pasien tidak boleh diisi.',
            'scheduled_at.required' => 'Jadwal wajib diisi.',
            'scheduled_at.after' => 'Jadwal harus di masa depan.',
        ];
    }

    /**
     * Resolve the patient ID: admin supplies it, a patient uses their own
     * linked record (created on the fly if the account has no patient row yet).
     */
    public function patientId(): int
    {
        if ($this->user()->hasAppRole('admin')) {
            return (int) $this->validated('patient_id');
        }

        $patient = Patient::firstOrCreate(
            ['user_id' => $this->user()->id],
            [
                'clinic_id' => $this->user()->clinic_id,
                'name' => $this->user()->name,
                'gender' => 'male',
                'date_of_birth' => '1970-01-01',
            ],
        );

        return $patient->id;
    }

    /**
     * Resolve the chosen doctor within the actor's clinic.
     */
    public function doctor(): Doctor
    {
        return Doctor::findOrFail($this->validated('doctor_id'));
    }
}
