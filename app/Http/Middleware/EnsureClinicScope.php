<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Tenant context guard (DB-07 / AUTH-04 / BR-04).
 *
 * Guarantees that every authenticated, non-admin request carries a clinic
 * context. The actual row filtering is done by the `BelongsToClinic` global
 * scope; this middleware fails closed early for tenant-less non-admin accounts
 * so they can never reach unscoped queries.
 */
class EnsureClinicScope
{
    /**
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user && ! $user->isAdmin() && $user->clinic_id === null) {
            abort(403, 'Akun belum terhubung ke klinik.');
        }

        return $next($request);
    }
}
