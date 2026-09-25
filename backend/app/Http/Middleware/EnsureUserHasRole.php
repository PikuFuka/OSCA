<?php

namespace App\Http\Middleware;

use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Restrict a route to staff roles (e.g. `role:Admin,Staff`).
 *
 * Only `App\Models\User` records carry a staff role. Senior-citizen
 * tokens (Senior model) never satisfy a staff role and get 403, so
 * PII-heavy staff endpoints stay closed to self-service accounts.
 */
class EnsureUserHasRole
{
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        $role = $user instanceof User ? $user->role : null;

        if (!$user || !in_array($role, $roles, true)) {
            return response()->json(['message' => 'Forbidden. Insufficient role.'], 403);
        }

        return $next($request);
    }
}
