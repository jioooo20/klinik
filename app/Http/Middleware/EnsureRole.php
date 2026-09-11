<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Role-based access control middleware (KLK-016).
 *
 * Accepts one or more role names, e.g. `role:admin,dokter`. Access is
 * granted when the authenticated user holds at least one of the roles via
 * spatie/laravel-permission OR matches the fast-path `users.role` enum.
 */
class EnsureRole
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if (! $user) {
            abort(403, 'Unauthenticated.');
        }

        if ($roles === []) {
            return $next($request);
        }

        // spatie roles (authoritative) — falling back to the enum fast-path.
        $hasSpatieRole = method_exists($user, 'hasAnyRole')
            && $user->hasAnyRole($roles);

        $enumRole = $user->role instanceof \BackedEnum
            ? $user->role->value
            : (string) $user->role;

        if (! $hasSpatieRole && ! in_array($enumRole, $roles, true)) {
            abort(403, 'Akses ditolak: peran tidak diizinkan.');
        }

        return $next($request);
    }
}
