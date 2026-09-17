<?php

namespace App\Observers;

use App\Models\Senior;
use App\Support\RealtimeFeed;
use Illuminate\Support\Facades\Cache;

class SeniorObserver
{
    public function saved(Senior $senior): void
    {
        $this->clearCaches();
        // Wake up realtime registry streams (atomic sequence bump).
        RealtimeFeed::bump();
    }

    public function deleted(Senior $senior): void
    {
        $this->clearCaches();
        RealtimeFeed::bump();
    }

    public function restored(Senior $senior): void
    {
        $this->clearCaches();
        RealtimeFeed::bump();
    }

    private function clearCaches(): void
    {
        // File driver: forget known stats keys; with redis you would use tags
        Cache::forget('stats:v2:all:all');
        if (Cache::has('seniors:cache_version')) {
            Cache::increment('seniors:cache_version');
        } else {
            Cache::forever('seniors:cache_version', 2);
        }
    }
}
