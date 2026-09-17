<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Services\Backup\BackupService;
use Illuminate\Http\Request;

class BackupController extends Controller
{
    /**
     * Export (download) the entire database as a SQL dump.
     */
    public function export(Request $request)
    {
        // Only admins can export database
        $user = $request->user();
        $isUser = $user instanceof \App\Models\User;
        if (!$isUser || $user->role !== 'Admin') {
            return response()->json(['message' => 'Unauthorized. Admin access required.'], 403);
        }

        // Modular async path — queueable job (see app/Jobs/BackupExportJob.php ShouldQueue)
        if ($request->boolean('async') || $request->boolean('queue')) {
            $filename = 'osca_backup_' . date('Y-m-d_His') . '.sql';
            \App\Jobs\BackupExportJob::dispatch($user->id, $filename);
            return response()->json(['queued'=>true,'message'=>'Backup queued via file queue (database driver). Run php artisan queue:work to process.','filename'=>$filename], 202);
        }

        $filename = 'osca_backup_' . date('Y-m-d_His') . '.sql';
        $tempPath = storage_path('app/' . $filename);

        try {
            app(BackupService::class)->dumpToFile($tempPath);
        } catch (\RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 500);
        }

        ActivityLog::create([
            'user_id' => $user->id,
            'action'  => 'DATABASE_EXPORT',
            'target_type' => 'System',
            'target_id'   => null,
            'details'     => ['filename' => $filename],
            'ip_address'  => $request->ip(),
        ]);

        return response()->download($tempPath, $filename, [
            'Content-Type' => 'application/sql',
        ])->deleteFileAfterSend(true);
    }

    /**
     * Import a SQL backup file.
     */
    public function import(Request $request)
    {
        // Only admins can import database
        $user = $request->user();
        $isUser = $user instanceof \App\Models\User;
        if (!$isUser || $user->role !== 'Admin') {
            return response()->json(['message' => 'Unauthorized. Admin access required.'], 403);
        }

        $request->validate([
            'file' => 'required|file|max:' . BackupService::HTTP_MAX_KB,
        ], [
            // 100 MB matches the Cloudflare edge upload limit; anything larger
            // must be restored on the server itself (php artisan backup:restore).
            'file.max' => 'The backup file must not be larger than 100 MB. For larger files, restore directly on the server: php artisan backup:restore <file>.',
        ]);

        // Async path for large imports — queueable (see app/Jobs/BackupImportJob.php ShouldQueue)
        if ($request->boolean('async') || $request->boolean('queue')) {
            $file = $request->file('file');
            $tempPath = storage_path('app/private/imports/' . time() . '_' . $file->getClientOriginalName());
            if (!is_dir(dirname($tempPath))) mkdir(dirname($tempPath), 0755, true);
            $file->move(dirname($tempPath), basename($tempPath));
            \App\Jobs\BackupImportJob::dispatch($tempPath, $request->user()->id);
            return response()->json(['queued'=>true,'message'=>'Import queued via file queue. Run php artisan queue:work.'], 202);
        }

        $file = $request->file('file');
        $ext  = strtolower($file->getClientOriginalExtension());

        if (!in_array($ext, ['sql'])) {
            return response()->json(['success' => false, 'message' => 'Only .sql files are accepted.'], 422);
        }

        $raw = file_get_contents($file->getRealPath());

        // Strip UTF-8 BOM if present
        if (str_starts_with($raw, "\xEF\xBB\xBF")) {
            $raw = substr($raw, 3);
        }

        // Ensure the content is valid UTF-8; attempt conversion if not
        if (!mb_check_encoding($raw, 'UTF-8')) {
            $raw = mb_convert_encoding($raw, 'UTF-8', 'UTF-8, ISO-8859-1, Windows-1252');
        }

        $tempPath = storage_path('app/osca_import_' . time() . '.sql');
        file_put_contents($tempPath, $raw);

        $service = app(BackupService::class);

        try {
            // A restorable snapshot is mandatory: the PHP fallback path cannot
            // roll back MySQL DDL, so without a snapshot a failed import could
            // leave a half-restored database. Operators with no mysqldump
            // available may pass ?skip_snapshot=1 (logged below).
            if (!$request->boolean('skip_snapshot')) {
                try {
                    $snapshotPath = $service->snapshot();
                } catch (\RuntimeException $e) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Import aborted: safety snapshot failed (' . $e->getMessage() . '). Pass ?skip_snapshot=1 to proceed without a snapshot at your own risk.',
                    ], 500);
                }
            } else {
                $snapshotPath = null;
                \Illuminate\Support\Facades\Log::warning('Database import proceeding WITHOUT safety snapshot (skip_snapshot=1).', [
                    'admin_id' => $user->id,
                    'filename' => $file->getClientOriginalName(),
                ]);
            }

            $service->restoreFromSqlFile($tempPath, $raw);

            @unlink($tempPath);

            ActivityLog::create([
                'user_id' => $user->id,
                'action'  => 'DATABASE_IMPORT',
                'target_type' => 'System',
                'target_id'   => null,
                'details'     => [
                    'filename' => $file->getClientOriginalName(),
                    'size' => $file->getSize(),
                    'snapshot' => isset($snapshotPath) && $snapshotPath ? basename($snapshotPath) : null,
                ],
                'ip_address'  => $request->ip(),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Database restored successfully from backup.'
                    . (isset($snapshotPath) && $snapshotPath ? ' Pre-import snapshot kept at storage/app/private/backups/' . basename($snapshotPath) . '.' : ''),
            ]);
        } catch (\Exception $e) {
            @unlink($tempPath);
            return response()->json([
                'success' => false,
                'message' => 'Import failed: ' . $e->getMessage(),
            ], 500);
        }
    }
}
