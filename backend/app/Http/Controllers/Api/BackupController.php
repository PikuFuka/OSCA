<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Artisan;

class BackupController extends Controller
{
    /**
     * Export (download) the entire database as a SQL dump.
     */
    public function export(Request $request)
    {
        $database = config('database.connections.mysql.database');
        $username = config('database.connections.mysql.username');
        $password = config('database.connections.mysql.password');
        $host     = config('database.connections.mysql.host');
        $port     = config('database.connections.mysql.port', 3306);

        $filename = 'osca_backup_' . date('Y-m-d_His') . '.sql';
        $tempPath = storage_path('app/' . $filename);

        // Build mysqldump command
        $passwordArg = $password ? "-p\"{$password}\"" : '';
        $command = "mysqldump --user=\"{$username}\" {$passwordArg} --host=\"{$host}\" --port={$port} --single-transaction --routines --triggers \"{$database}\" > \"{$tempPath}\" 2>&1";

        exec($command, $output, $returnCode);

        if ($returnCode !== 0 || !file_exists($tempPath) || filesize($tempPath) === 0) {
            // Fallback: build SQL from PHP if mysqldump is unavailable
            $sql = $this->buildSqlDump($database);
            file_put_contents($tempPath, $sql);
        }

        $user = $request->user();
        $isUser = $user instanceof \App\Models\User;

        ActivityLog::create([
            'user_id' => $isUser ? $user->id : null,
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
        $request->validate([
            'file' => 'required|file|max:512000', // 500 MB
        ]);

        $file = $request->file('file');
        $ext  = strtolower($file->getClientOriginalExtension());

        if (!in_array($ext, ['sql'])) {
            return response()->json(['success' => false, 'message' => 'Only .sql files are accepted.'], 422);
        }

        $sql = file_get_contents($file->getRealPath());

        try {
            DB::unprepared($sql);

            $user = $request->user();
            $isUser = $user instanceof \App\Models\User;

            ActivityLog::create([
                'user_id' => $isUser ? $user->id : null,
                'action'  => 'DATABASE_IMPORT',
                'target_type' => 'System',
                'target_id'   => null,
                'details'     => ['filename' => $file->getClientOriginalName(), 'size' => $file->getSize()],
                'ip_address'  => $request->ip(),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Database restored successfully from backup.',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Import failed: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * PHP-based SQL dump fallback when mysqldump is not available.
     */
    private function buildSqlDump(string $database): string
    {
        $sql = "-- OSCA System Database Backup\n";
        $sql .= "-- Generated: " . now()->toDateTimeString() . "\n";
        $sql .= "-- Database: {$database}\n\n";
        $sql .= "SET FOREIGN_KEY_CHECKS=0;\n\n";

        $tables = DB::select('SHOW TABLES');
        $key = "Tables_in_{$database}";

        foreach ($tables as $table) {
            $tableName = $table->$key;

            // CREATE TABLE
            $create = DB::select("SHOW CREATE TABLE `{$tableName}`");
            $sql .= "DROP TABLE IF EXISTS `{$tableName}`;\n";
            $sql .= $create[0]->{'Create Table'} . ";\n\n";

            // INSERT rows
            $rows = DB::table($tableName)->get();
            foreach ($rows as $row) {
                $values = collect((array) $row)->map(function ($v) {
                    if (is_null($v)) return 'NULL';
                    return "'" . addslashes((string) $v) . "'";
                })->implode(', ');
                $sql .= "INSERT INTO `{$tableName}` VALUES ({$values});\n";
            }
            $sql .= "\n";
        }

        $sql .= "SET FOREIGN_KEY_CHECKS=1;\n";
        return $sql;
    }
}
