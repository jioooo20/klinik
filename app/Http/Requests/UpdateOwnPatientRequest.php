<?php

namespace App\Http\Requests;

use App\Models\Patient;
use Illuminate\Foundation\Http\FormRequest;

/**
 * Pasien self-service update (Profil Saya).
 *
 * Hanya field non-master yang boleh diubah sendiri oleh pasien:
 * blood_type, allergies, phone, address, emergency_contact_name,
 * emergency_contact_phone. NIK / name / date_of_birth / gender tetap
 * dikendalikan admin (lihat PatientPolicy::update()).
 */
class UpdateOwnPatientRequest extends FormRequest
{
    /**
     * Authorization is delegated to PatientPolicy::updateSelf(); the route
     * additionally enforces the `role:pasien` middleware.
     */
    public function authorize(): bool
    {
        $user = $this->user();

        if ($user === null) {
            return false;
        }

        // The route is `/profile` with no {patient} parameter, so the row is
        // resolved from the authenticated user (never from the URL).
        $patient = Patient::forUser($user);

        if ($patient === null) {
            return false;
        }

        return $user->can('updateSelf', $patient);
    }

    /**
     * Strict whitelist: only the six self-serviceable fields are validated,
     * so `$request->validated()` can never mass-assign master data.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'blood_type' => ['nullable', 'string', 'in:A,B,AB,O'],
            'allergies' => ['nullable', 'string', 'max:1000'],
            'phone' => ['nullable', 'string', 'max:30'],
            'address' => ['nullable', 'string'],
            'emergency_contact_name' => ['nullable', 'string', 'max:150'],
            'emergency_contact_phone' => ['nullable', 'string', 'max:30'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'blood_type.in' => 'Golongan darah harus salah satu dari A, B, AB, atau O.',
            'allergies.max' => 'Alergi maksimal 1000 karakter.',
            'phone.max' => 'Telepon maksimal 30 karakter.',
            'emergency_contact_name.max' => 'Nama kontak darurat maksimal 150 karakter.',
            'emergency_contact_phone.max' => 'Telepon kontak darurat maksimal 30 karakter.',
        ];
    }
}