<?php

namespace App\Http\Requests;

use App\Enums\UserRole;
use App\Models\Doctor;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class StoreDoctorRequest extends FormRequest
{
    /**
     * Hanya admin yang boleh membuat dokter (defence-in-depth; route juga
     * menegakkan role:admin).
     */
    public function authorize(): bool
    {
        return $this->user()?->can('create', Doctor::class) ?? false;
    }

    /**
     * Normalisasi sebelum validasi.
     *
     * Checkbox HTML yang tidak dicentang TIDAK ikut terkirim sama sekali, jadi
     * kunci `is_active` bisa hilang dari payload. Kita set default `true` agar
     * ketiadaannya tidak diam-diam menjadi null.
     */
    protected function prepareForValidation(): void
    {
        if (! $this->has('is_active')) {
            $this->merge(['is_active' => true]);
        }
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            // Email unik secara global pada tabel users (kolom unique di DB).
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique('users', 'email')],
            'phone' => ['nullable', 'string', 'max:30'],
            'password' => ['required', 'confirmed', Password::defaults()],
            'specialty' => ['nullable', 'string', 'max:100'],
            'str_number' => ['nullable', 'string', 'max:50'],
            'is_active' => ['boolean'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'name.required' => 'Nama dokter wajib diisi.',
            'email.required' => 'Email wajib diisi.',
            'email.email' => 'Format email tidak valid.',
            'email.unique' => 'Email sudah digunakan oleh akun lain.',
            'phone.max' => 'Telepon maksimal 30 karakter.',
            'password.required' => 'Kata sandi wajib diisi.',
            'password.confirmed' => 'Konfirmasi kata sandi tidak cocok.',
            'specialty.max' => 'Spesialisasi maksimal 100 karakter.',
            'str_number.max' => 'Nomor STR maksimal 50 karakter.',
            'is_active.boolean' => 'Status aktif tidak valid.',
        ];
    }

    /**
     * Dipakai controller untuk membuat akun user dengan peran dokter.
     */
    public function doctorRole(): UserRole
    {
        return UserRole::Dokter;
    }
}
