<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use App\Enums\UserRole;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, HasRoles, Notifiable, SoftDeletes;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'clinic_id',
        'name',
        'email',
        'password',
        'role',
        'phone',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'role' => UserRole::class,
        ];
    }

    public function clinic(): BelongsTo
    {
        return $this->belongsTo(Clinic::class);
    }

    public function doctor(): HasOne
    {
        return $this->hasOne(Doctor::class);
    }

    public function patients(): HasMany
    {
        return $this->hasMany(Patient::class);
    }

    public function createdAppointments(): HasMany
    {
        return $this->hasMany(Appointment::class, 'created_by');
    }

    public function isAdmin(): bool
    {
        return $this->role === UserRole::Admin;
    }

    /**
     * Role check that honours BOTH the spatie role assignment and the
     * `users.role` enum fast-path (KLK-014/KLK-016). Policies use this so a
     * user created with the enum but before spatie sync is still authorised.
     */
    public function hasAppRole(string ...$roles): bool
    {
        if (method_exists($this, 'hasAnyRole') && $this->hasAnyRole($roles)) {
            return true;
        }

        $enumRole = $this->role instanceof \BackedEnum
            ? $this->role->value
            : (string) $this->role;

        return in_array($enumRole, $roles, true);
    }

    /**
     * Platform-level super admin (no clinic bound) is the ONLY cross-tenant
     * actor. A clinic admin is tenant-scoped (BR-04).
     */
    public function isCrossTenant(): bool
    {
        return $this->isAdmin() && $this->clinic_id === null;
    }

    public function isDokter(): bool
    {
        return $this->role === UserRole::Dokter;
    }

    public function isPasien(): bool
    {
        return $this->role === UserRole::Pasien;
    }
}
