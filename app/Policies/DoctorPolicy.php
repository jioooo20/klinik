<?php

namespace App\Policies;

use App\Models\Doctor;
use App\Models\User;

/**
 * Doctor authorization.
 *
 * - admin: full management (create/update) scoped to their own clinic
 * - dokter / pasien: denied entirely
 *
 * Catatan: model Doctor TIDAK memakai trait BelongsToClinic sehingga tidak ada
 * global scope — isolasi tenant harus ditegakkan eksplisit di policy ini dan di
 * setiap query controller.
 */
class DoctorPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasAppRole('admin');
    }

    public function create(User $user): bool
    {
        return $user->hasAppRole('admin');
    }

    /**
     * Admin-only, dan hanya untuk dokter pada klinik yang sama.
     *
     * Pola tenancy mengikuti PatientPolicy::update(): super admin lintas-tenant
     * (clinic_id null) diizinkan, selain itu clinic_id dokter harus sama.
     */
    public function update(User $user, Doctor $doctor): bool
    {
        return $user->hasAppRole('admin')
            && ($user->isCrossTenant() || $doctor->clinic_id === $user->clinic_id);
    }
}
