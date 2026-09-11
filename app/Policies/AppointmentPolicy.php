<?php

namespace App\Policies;

use App\Enums\AppointmentStatus;
use App\Models\Appointment;
use App\Models\User;

/**
 * Appointment authorization (KLK-017).
 *
 * - create: pasien or admin
 * - view: own for pasien, all for admin/dokter
 * - update status: dokter or admin
 * - delete: pasien (own, before confirmed) or admin
 */
class AppointmentPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasAppRole('admin', 'dokter', 'pasien');
    }

    public function view(User $user, Appointment $appointment): bool
    {
        // Tenant isolation is enforced here as the final layer (BR-04).
        if (! $user->isCrossTenant() && $appointment->clinic_id !== $user->clinic_id) {
            return false;
        }

        if ($user->hasAppRole('admin', 'dokter')) {
            return true;
        }

        return $user->hasAppRole('pasien')
            && $appointment->patient?->user_id === $user->id;
    }

    public function create(User $user): bool
    {
        return $user->hasAppRole('pasien', 'admin');
    }

    public function updateStatus(User $user, Appointment $appointment): bool
    {
        return $user->hasAppRole('dokter', 'admin')
            && ($user->isCrossTenant() || $appointment->clinic_id === $user->clinic_id);
    }

    public function delete(User $user, Appointment $appointment): bool
    {
        if ($user->hasAppRole('admin')
            && ($user->isCrossTenant() || $appointment->clinic_id === $user->clinic_id)) {
            return true;
        }

        $ownsIt = $user->hasAppRole('pasien')
            && $appointment->patient?->user_id === $user->id;

        // A patient may only cancel while still pending.
        return $ownsIt && $appointment->status === AppointmentStatus::Pending;
    }
}
