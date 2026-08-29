<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;

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
    }
}
