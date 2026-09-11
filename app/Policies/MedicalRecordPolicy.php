<?php

namespace App\Policies;

use App\Models\MedicalRecord;
use App\Models\User;

/**
 * Medical record authorization (KLK-017).
 *
 * - create/store: dokter only
 * - view: admin, dokter, or the patient who owns the record
 * - update: the dokter who authored it or an admin
 * - delete: never (immutable per BR-07)
 */
class MedicalRecordPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasAppRole('admin', 'dokter');
    }

    public function view(User $user, MedicalRecord $record): bool
    {
        // Tenant isolation is enforced here as the final layer (BR-04).
        if (! $user->isCrossTenant() && $record->clinic_id !== $user->clinic_id) {
            return false;
        }

        if ($user->hasAppRole('admin', 'dokter')) {
            return true;
        }

        return $user->hasAppRole('pasien')
            && $record->patient?->user_id === $user->id;
    }

    public function create(User $user): bool
    {
        return $user->hasAppRole('dokter');
    }

    public function update(User $user, MedicalRecord $record): bool
    {
        if (! $user->isCrossTenant() && $record->clinic_id !== $user->clinic_id) {
            return false;
        }

        if ($user->hasAppRole('admin')) {
            return true;
        }

        return $user->hasAppRole('dokter')
            && $record->doctor?->user_id === $user->id;
    }

    public function delete(User $user, MedicalRecord $record): bool
    {
        // Immutable clinical record (BR-07).
        return false;
    }
}
