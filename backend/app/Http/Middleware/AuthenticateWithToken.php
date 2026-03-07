<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AuthenticateWithToken
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->has('token')) {
            $request->headers->set('Authorization', 'Bearer ' . $request->query('token'));
        }

        if ($token = $request->query('token')) {
            $request->headers->set('Authorization', 'Bearer ' . $token);
        }

        if ($request->header('Authorization')) {
            error_log('Auth Header: ' . substr($request->header('Authorization'), 0, 15) . '...');
        }

        return $next($request);
    }
}
