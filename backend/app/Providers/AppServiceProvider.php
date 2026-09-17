<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Http\Request;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        \App\Models\Senior::observe(\App\Observers\SeniorObserver::class);
        \App\Models\Request::observe(\App\Observers\RequestObserver::class);

        // Limit login attempts to 5 per minute per IP and per account to prevent brute-force attacks
        RateLimiter::for('login', function (Request $request) {
            $identifier = (string) ($request->identifier ?? $request->email ?? $request->osca_id ?? '');
            $userKey = Str::lower(trim($identifier)) . '|' . $request->ip();

            return [
                Limit::perMinute(5)->by($userKey)->response(function (Request $request, array $headers) {
                    $seconds = $headers['Retry-After'] ?? 60;
                    return response()->json([
                        'message' => "Too many login attempts. Please wait {$seconds} seconds before trying again.",
                    ], 429, $headers);
                }),
                Limit::perMinute(5)->by($request->ip())->response(function (Request $request, array $headers) {
                    $seconds = $headers['Retry-After'] ?? 60;
                    return response()->json([
                        'message' => "Too many login attempts. Please wait {$seconds} seconds before trying again.",
                    ], 429, $headers);
                }),
            ];
        });
    }
}
