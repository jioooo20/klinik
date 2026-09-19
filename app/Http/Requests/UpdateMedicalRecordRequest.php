<?php

namespace App\Http\Requests;

use App\Models\MedicalRecord;
use Closure;
use Illuminate\Foundation\Http\FormRequest;

class UpdateMedicalRecordRequest extends FormRequest
{
    /**
     * Only the authoring dokter or an admin may revise a record (BR-06/BR-07).
     */
    public function authorize(): bool
    {
        $record = $this->route('record');

        return $record instanceof MedicalRecord
            && ($this->user()?->can('update', $record) ?? false);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'appointment_id' => ['nullable', 'integer', 'exists:appointments,id'],
            'visited_at' => ['required', 'date'],

            // BR-05: SOAP remains mandatory on revision.
            'subjective' => ['required', 'string', 'max:5000'],
            'objective' => ['required', 'string', 'max:5000'],
            'assessment' => ['required', 'string', 'max:5000'],
            'plan' => ['required', 'string', 'max:5000'],

            // Lebar kolom icd10_code = varchar(255). Batas 20 kode + aturan
            // per-elemen max:10 di bawah menjamin muatan tidak pernah
            // melampaui lebar kolom (20 x 10 + 19 koma = 219 karakter).
            // Guard panjang total ditambahkan sebagai lapisan kedua.
            'icd10_codes' => [
                'nullable',
                'array',
                'max:20',
                function (string $attribute, mixed $value, Closure $fail): void {
                    if (! is_array($value)) {
                        return;
                    }

                    $joined = implode(',', array_filter(
                        array_map(fn ($code) => is_string($code) ? trim($code) : '', $value),
                        fn ($code) => $code !== '',
                    ));

                    if (strlen($joined) > 255) {
                        $fail('Total kode ICD-10 terlalu panjang (maksimal 255 karakter).');
                    }
                },
            ],
            'icd10_codes.*' => ['string', 'max:10', 'exists:icd10_codes,code'],

            // Tanda vital (opsional seluruhnya). Semua nilai numerik dengan
            // batas fisiologis; tensi dipecah menjadi sistolik + diastolik.
            // Rentang dewasa mengacu pada pedoman AHA/ACC (tekanan darah) dan
            // batas alarm NEWS2 / atlas tanda vital dewasa sebagai pagar
            // keamanan input (bukan ambang diagnosis).
            'vitals' => [
                'nullable',
                'array',
                function (string $attribute, mixed $value, Closure $fail): void {
                    if (! is_array($value)) {
                        return;
                    }

                    // Sistolik harus > diastolik; nilai terbalik/identik tidak
                    // fisiologis untuk tekanan darah.
                    $sistolik = $value['sistolik'] ?? null;
                    $diastolik = $value['diastolik'] ?? null;

                    if ($sistolik !== null && $diastolik !== null
                        && (int) $sistolik <= (int) $diastolik) {
                        $fail('Tekanan darah sistolik harus lebih besar daripada diastolik.');
                    }
                },
            ],
            'vitals.sistolik' => ['nullable', 'integer', 'between:60,260'],
            'vitals.diastolik' => ['nullable', 'integer', 'between:30,160'],
            'vitals.suhu' => ['nullable', 'numeric', 'between:30,45'],
            'vitals.nadi' => ['nullable', 'integer', 'between:20,250'],
            'vitals.respirasi' => ['nullable', 'integer', 'between:5,80'],

            'prescription' => ['nullable', 'string', 'max:5000'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'visited_at.required' => 'Tanggal kunjungan wajib diisi.',
            'subjective.required' => 'Subjective (S) wajib diisi untuk finalisasi.',
            'objective.required' => 'Objective (O) wajib diisi untuk finalisasi.',
            'assessment.required' => 'Assessment (A) wajib diisi untuk finalisasi.',
            'plan.required' => 'Plan (P) wajib diisi untuk finalisasi.',
            'icd10_codes.max' => 'Maksimal 20 kode ICD-10 dapat dipilih.',

            'vitals.sistolik.integer' => 'Tekanan darah sistolik harus berupa angka.',
            'vitals.sistolik.between' => 'Tekanan darah sistolik harus antara 60 dan 260 mmHg.',
            'vitals.diastolik.integer' => 'Tekanan darah diastolik harus berupa angka.',
            'vitals.diastolik.between' => 'Tekanan darah diastolik harus antara 30 dan 160 mmHg.',
            'vitals.suhu.numeric' => 'Suhu tubuh harus berupa angka.',
            'vitals.suhu.between' => 'Suhu tubuh harus antara 30 dan 45 °C.',
            'vitals.nadi.integer' => 'Nadi harus berupa angka.',
            'vitals.nadi.between' => 'Nadi harus antara 20 dan 250 kali per menit.',
            'vitals.respirasi.integer' => 'Respirasi harus berupa angka.',
            'vitals.respirasi.between' => 'Respirasi harus antara 5 dan 80 kali per menit.',
        ];
    }
}
