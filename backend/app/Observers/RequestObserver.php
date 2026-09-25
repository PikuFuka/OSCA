<?php

namespace App\Observers;

use App\Models\Request;
use Illuminate\Support\Facades\Cache;

class RequestObserver
{
    public function created(Request $request): void { $this->clear(); }
    public function updated(Request $request): void { $this->clear(); }
    public function deleted(Request $request): void { $this->clear(); }

    private function clear(): void
    {
        // File driver: forget known index keys; with redis use tags
        Cache::forget('requests:pending:1:15');
        // Optionally flush senior stats if request approval changes senior status
        Cache::forget('stats:v3:all:all');
    }
}
