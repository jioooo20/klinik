<?php

namespace App\Models;

use App\Traits\BelongsToClinic;
use Database\Factories\PatientFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Patient extends Model
{
    /** @use HasFactory<PatientFactory> */
    use BelongsToClinic, HasFactory, SoftDeletes;

    protected $fillable = [
        'clinic_id',
        'nik',
        'name',
        'date_of_birth',
        'gender',
        'blood_type',
        'allergies',
        'phone',
        'address',
        'emergency_contact_name',
        'emergency_contact_phone',
        'user_id',
    ];

    protected function casts(): array
    {
        return [
            'date_of_birth' => 'date',
        ];
    }

    public function clinic(): BelongsTo
    {
        return $this->belongsTo(Clinic::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Resolve the Patient row linked to the given user, bypassing the tenant
     * scope because a pasien's clinic_id may legitimately differ from the
     * session default during cross-clinic flows. Used by the pasien
     * self-service profile flow (Profil Saya) so no patient id is ever taken
     * from the URL.
     */
    public static function forUser(User $user): ?self
    {
        return static::withoutClinicScope()
            ->where('user_id', $user->id)
            ->first();
    }

    public function appointments(): HasMany
    {
        return $this->hasMany(Appointment::class);
    }

    public function medicalRecords(): HasMany
    {
        return $this->hasMany(MedicalRecord::class);
    }
}
