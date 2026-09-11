<?php

namespace App\Models;

use App\Traits\BelongsToClinic;
use Database\Factories\MedicalRecordFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MedicalRecord extends Model
{
    /** @use HasFactory<MedicalRecordFactory> */
    use BelongsToClinic, HasFactory;

    // Immutable: no SoftDeletes (BR-07).
    protected $fillable = [
        'clinic_id',
        'patient_id',
        'doctor_id',
        'appointment_id',
        'visited_at',
        'subjective',
        'objective',
        'assessment',
        'plan',
        'icd10_code',
        'vitals',
        'prescription',
    ];

    protected function casts(): array
    {
        return [
            'visited_at' => 'datetime',
            'vitals' => 'array',
            'prescription' => 'array',
            // BR-11: sensitive clinical narrative is encrypted at rest.
            'subjective' => 'encrypted',
            'objective' => 'encrypted',
            'assessment' => 'encrypted',
            'plan' => 'encrypted',
        ];
    }

    public function clinic(): BelongsTo
    {
        return $this->belongsTo(Clinic::class);
    }

    public function patient(): BelongsTo
    {
        return $this->belongsTo(Patient::class);
    }

    public function doctor(): BelongsTo
    {
        return $this->belongsTo(Doctor::class);
    }

    public function appointment(): BelongsTo
    {
        return $this->belongsTo(Appointment::class);
    }
}
