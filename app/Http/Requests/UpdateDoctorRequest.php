<?php

namespace App\Http\Requests;

use App\Models\Doctor;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class UpdateDoctorRequest extends FormRequest
{
    /**
     * Hanya admin (pada klinik yang sama) yang boleh mengubah dokter
     * (defence-in-depth; route juga menegakkan role:admin).
     */
    public function authorize(): bool
    {
        /** @var Doctor $doctor */
        $doctor = $this->route('doctor');

        return $this->user()?->can('update', $doctor) ?? false;
    }

    /**
     * Checkbox HTML yang tidak dicentang TIDAK terkirim, sehingga `is_active`
     * bisa hilang dari payload. Di sini kita sengaja BUKAN mengisi default true:
     * form edit selalu mengirim nilai boolean eksplisit (true/false), jadi bila
     * kunci tidak ada kita biarkan dan menggagalkan validasi via `boolean` +
     * required di bawah — ini mencegah toggle status "diam-diam" ter-reset.
     */
    protected function prepareForValidation(): void
    {
        // Terima nilai dari checkbox sebagai string/boolean; tidak menambah
        // default apa pun agar tidak ada perubahan status tak sengaja.
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        /** @var Doctor $doctor */
        $doctor = $this->route('doctor');
        $userId = $doctor?->user_id;

        return [
            'name' => ['required', 'string', 'max:255'],
            // Email unik global; abaikan user milik dokter yang sedang diedit.
            'email' => [
                'required',
                'string',
                'email',
                'max:255',
                Rule::unique('users', 'email')->ignore($userId),
            ],
            'phone' => ['nullable', 'string', 'max:30'],
            // Kata sandi opsional: kosong = pertahankan kata sandi lama.
            'password' => ['nullable', 'confirmed', Password::defaults()],
            'specialty' => ['nullable', 'string', 'max:100'],
            'str_number' => ['nullable', 'string', 'max:50'],
            'is_active' => ['required', 'boolean'],
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
            'password.confirmed' => 'Konfirmasi kata sandi tidak cocok.',
            'specialty.max' => 'Spesialisasi maksimal 100 karakter.',
            'str_number.max' => 'Nomor STR maksimal 50 karakter.',
            'is_active.required' => 'Status aktif wajib ditentukan.',
            'is_active.boolean' => 'Status aktif tidak valid.',
        ];
    }

    /**
     * Apakah pengguna mengirim kata sandi baru (non-kosong)?
     */
    public function hasNewPassword(): bool
    {
        $password = $this->input('password');

        return is_string($password) && $password !== '';
    }
}
