<?php

namespace App\Traits;

use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;

/**
 * Multi-tenant isolation (DB-07 / BR-04).
 *
 * Adds a `clinic` global scope that filters every query by the authenticated
 * user's `clinic_id`. Admin (super-admin) accounts are cross-tenant and are
 * intentionally NOT filtered. Use `withoutClinicScope()` for explicit bypass
 * (console commands, cross-clinic reporting, super-admin screens).
 *
 * The `creating` hook backfills `clinic_id` from the authenticated user so
 * new rows are always tenant-stamped, even if the caller forgot.
 */
trait BelongsToClinic
{
    public static function bootBelongsToClinic(): void
    {
        static::addGlobalScope('clinic', function (Builder $builder): void {
            $user = Auth::user();

            // No authenticated context (console, queue, seeding): leave unfiltered.
            if (! $user instanceof User) {
                return;
            }

            // Cross-tenant (platform super-admin, clinic_id === null) bypass only
            // (BR-04 "bypass eksplisit untuk super admin"). A clinic admin is
            // tenant-scoped like everyone else.
            if ($user->isCrossTenant()) {
                return;
            }

            // Authenticated but tenant-less non-admin: fail closed.
            if ($user->clinic_id === null) {
                $builder->whereRaw('1 = 0');

                return;
            }

            $builder->where(
                $builder->getModel()->getTable().'.clinic_id',
                $user->clinic_id,
            );
        });

        static::creating(function (Model $model): void {
            if ($model->getAttribute('clinic_id') !== null) {
                return;
            }

            $user = Auth::user();

            if ($user instanceof User && $user->clinic_id !== null) {
                $model->setAttribute('clinic_id', $user->clinic_id);
            }
        });
    }

    /**
     * Bypass the tenant global scope (explicit, auditable escape hatch).
     *
     * @return Builder<static>
     */
    public static function withoutClinicScope(): Builder
    {
        return static::withoutGlobalScope('clinic');
    }
}
