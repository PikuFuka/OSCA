<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Server-side enforcement of the forced-password-change flag.
 *
 * The SPA already gates its UI on force_password_change, but that is only
 * advisory: API access must be blocked until the password is changed, or a
 * leaked/stale default credential stays usable. Self-service routes that let
 * the user comply (me, logout, change-password) are always allowed through.
 */
class EnsurePasswordChanged
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user && ($user->force_password_change ?? false)) {
            $path = '/' . ltrim($request->path(), '/');

            $allowed = str_ends_with($path, '/me')
                || str_ends_with($path, '/logout')
                || str_ends_with($path, '/change-password');

            if (!$allowed) {
                return response()->json([
                    'message' => 'Password change required before continuing.',
                    'password_change_required' => true,
                ], 403);
            }
        }

        return $next($request);
    }
}
