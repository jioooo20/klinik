<?php

namespace App\Policies;

use App\Models\User;

class DoctorPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasAppRole('admin');
    }
}
