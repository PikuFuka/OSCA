<?php

namespace App\Observers;

use App\Models\Senior;
use Illuminate\Support\Facades\Cache;

class SeniorObserver
{
    public function saved(Senior $senior): void
    {
        $this->clearCaches();
    }

    public function deleted(Senior $senior): void
    {
        $this->clearCaches();
    }

    public function restored(Senior $senior): void
    {
        $this->clearCaches();
    }

    private function clearCaches(): void
    {
        // File driver: forget known stats keys; with redis you would use tags
        Cache::forget('stats:v2:all:all');
        // Optionally flush seniors index cache pattern — for file driver we rely on TTL (45s) to avoid scan
    }
}
