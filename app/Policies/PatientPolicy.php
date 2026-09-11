<?php

namespace App\Policies;

use App\Models\Patient;
use App\Models\User;

/**
 * Patient authorization (KLK-017).
 *
 * - admin: full management
 * - dokter: read-only
 * - pasien: read own record only
 */
class PatientPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasAppRole('admin', 'dokter');
    }

    public function view(User $user, Patient $patient): bool
    {
        // Tenant isolation is enforced here as the final layer (BR-04).
        if (! $user->isCrossTenant() && $patient->clinic_id !== $user->clinic_id) {
            return false;
        }

        if ($user->hasAppRole('admin', 'dokter')) {
            return true;
        }

        return $user->hasAppRole('pasien') && $patient->user_id === $user->id;
    }

    public function create(User $user): bool
    {
        return $user->hasAppRole('admin');
    }

    public function update(User $user, Patient $patient): bool
    {
        return $user->hasAppRole('admin')
            && ($user->isCrossTenant() || $patient->clinic_id === $user->clinic_id);
    }

    public function delete(User $user, Patient $patient): bool
    {
        return $this->update($user, $patient);
    }
}
