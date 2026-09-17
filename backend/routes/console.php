<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Auto-update senior ages on their birthday (runs daily at midnight)
Schedule::command('seniors:update-birthday-ages')->daily();

// Reconcile pending approval requests off the request path (1.1: the list
// endpoint is a pure read now). Cursor-based + idempotent, usually a no-op.
Schedule::job(new \App\Jobs\ReconcilePendingRequests)->everyFifteenMinutes();

// Prune audit logs older than the retention window (1.3: the log viewer is
// a pure read now; 0 = keep everything).
Schedule::call(fn () => \App\Support\AuditRetention::prune())->daily()->name('audit-prune');
