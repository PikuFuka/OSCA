<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Storage;

class BackupExportJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(public int $userId, public string $filename) {}

    public function handle(): void
    {
        // Lightweight async export — delegates to BackupService for streaming
        // For offline file driver, this runs via database queue and writes to storage/app/private/backups
        $service = app(\App\Services\Backup\BackupService::class);
        $service->exportToFile($this->filename);
    }
}
