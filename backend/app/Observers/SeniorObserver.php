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
        if (Cache::has('stats:cache_version')) {
            Cache::increment('stats:cache_version');
        } else {
            Cache::forever('stats:cache_version', 2);
        }
        if (Cache::has('seniors:cache_version')) {
            Cache::increment('seniors:cache_version');
        } else {
            Cache::forever('seniors:cache_version', 2);
        }
    }
}
