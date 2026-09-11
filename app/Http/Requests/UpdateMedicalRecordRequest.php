<?php

namespace App\Http\Requests;

use App\Models\MedicalRecord;
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

            'icd10_codes' => ['nullable', 'array'],
            'icd10_codes.*' => ['string', 'max:10', 'exists:icd10_codes,code'],

            'vitals' => ['nullable', 'array'],
            'vitals.tensi' => ['nullable', 'string', 'max:20'],
            'vitals.suhu' => ['nullable', 'string', 'max:20'],
            'vitals.nadi' => ['nullable', 'string', 'max:20'],
            'vitals.respirasi' => ['nullable', 'string', 'max:20'],

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
        ];
    }
}
