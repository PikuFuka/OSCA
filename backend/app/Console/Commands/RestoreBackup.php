<?php

namespace App\Console\Commands;

use App\Services\Backup\BackupService;
use Illuminate\Console\Command;

/**
 * Restore the database from a .sql file on the server itself.
 *
 * Browser uploads top out at the Cloudflare edge limit (100 MB), so the
 * production dump — which is larger — is restored locally with this command:
 *
 *   php artisan backup:restore C:\path\to\osca_db.sql
 *
 * A safety snapshot is taken first unless --skip-snapshot is given.
 */
class RestoreBackup extends Command
{
    protected $signature = 'backup:restore
        {file : Path to the .sql backup file}
        {--skip-snapshot : Proceed without taking a safety snapshot (not recommended)}';

    protected $description = 'Restore the database from a local .sql backup file (with safety snapshot)';

    public function handle(BackupService $service): int
    {
        $file = (string) $this->argument('file');

        if (!is_file($file) || strtolower(pathinfo($file, PATHINFO_EXTENSION)) !== 'sql') {
            $this->error('File not found or not a .sql file: ' . $file);
            return self::FAILURE;
        }

        if (!$this->option('skip-snapshot')) {
            $this->info('Taking safety snapshot...');
            try {
                $snapshot = $service->snapshot();
                $this->info('Snapshot kept at: ' . $snapshot);
            } catch (\RuntimeException $e) {
                $this->error('Snapshot failed, import aborted: ' . $e->getMessage());
                return self::FAILURE;
            }
        } else {
            $this->warn('Proceeding WITHOUT a safety snapshot.');
        }

        $this->info('Restoring from: ' . $file);
        try {
            $service->restoreFromSqlFile($file);
        } catch (\RuntimeException $e) {
            $this->error('Restore failed: ' . $e->getMessage());
            return self::FAILURE;
        }

        $this->info('Database restored successfully.');
        return self::SUCCESS;
    }
}
