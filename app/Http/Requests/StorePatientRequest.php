<?php

namespace App\Http\Requests;

use App\Models\Patient;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StorePatientRequest extends FormRequest
{
    /**
     * Only admin may create patients (defence-in-depth; the route also enforces role:admin).
     */
    public function authorize(): bool
    {
        return $this->user()?->can('create', Patient::class) ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $clinicId = $this->user()->clinic_id;

        return [
            'nik' => [
                'required',
                'string',
                'digits:16',
                Rule::unique('patients', 'nik')
                    ->where(fn ($query) => $query->where('clinic_id', $clinicId))
                    ->whereNull('deleted_at'),
            ],
            'name' => ['required', 'string', 'max:255'],
            'date_of_birth' => ['required', 'date', 'before:today'],
            'gender' => ['required', 'in:male,female'],
            'phone' => ['nullable', 'string', 'max:30'],
            'address' => ['nullable', 'string'],
            'blood_type' => ['nullable', 'string', 'in:A,B,AB,O'],
            'allergies' => ['nullable', 'string', 'max:1000'],
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
            'nik.required' => 'NIK wajib diisi.',
            'nik.digits' => 'NIK harus tepat 16 digit angka.',
            'nik.unique' => 'NIK sudah terdaftar untuk klinik ini.',
            'name.required' => 'Nama pasien wajib diisi.',
            'date_of_birth.required' => 'Tanggal lahir wajib diisi.',
            'date_of_birth.before' => 'Tanggal lahir harus sebelum hari ini.',
            'gender.required' => 'Jenis kelamin wajib dipilih.',
            'gender.in' => 'Jenis kelamin harus male atau female.',
            'blood_type.in' => 'Golongan darah harus salah satu dari A, B, AB, atau O.',
            'allergies.max' => 'Alergi maksimal 1000 karakter.',
            'emergency_contact_name.max' => 'Nama kontak darurat maksimal 150 karakter.',
            'emergency_contact_phone.max' => 'Telepon kontak darurat maksimal 30 karakter.',
        ];
    }
}
