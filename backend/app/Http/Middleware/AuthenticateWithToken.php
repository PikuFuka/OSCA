<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AuthenticateWithToken
{
    /**
     * Handle an incoming request.
     *
     * Historically this middleware promoted ?token= into an Authorization
     * header. That is intentionally GONE: bearer tokens in URLs leak into
     * server logs, browser history and Referer headers (CWE-598). This
     * middleware now only strips a stray `token` query parameter (defense in
     * depth, so no downstream code can ever pick it up) and never creates an
     * Authorization header. Browser-facing media uses short-lived signed
     * URLs (see App\Support\MediaUrls) instead.
     */
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->query->has('token')) {
            $request->query->remove('token');
        }

        return $next($request);
    }
}
