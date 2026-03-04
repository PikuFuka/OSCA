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
        // Only admins can export database
        $user = $request->user();
        $isUser = $user instanceof \App\Models\User;
        if (!$isUser || $user->role !== 'Admin') {
            return response()->json(['message' => 'Unauthorized. Admin access required.'], 403);
        }

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
            'file' => 'required|file|max:512000', // 500 MB
        ]);

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

        try {
            $database = config('database.connections.mysql.database');
            $username = config('database.connections.mysql.username');
            $password = config('database.connections.mysql.password');
            $host     = config('database.connections.mysql.host');
            $port     = config('database.connections.mysql.port', 3306);

            // Try mysql CLI first — it handles charsets natively with --default-character-set
            $passwordArg = $password ? "-p\"{$password}\"" : '';
            $command = "mysql --user=\"{$username}\" {$passwordArg} --host=\"{$host}\" --port={$port} --default-character-set=utf8mb4 \"{$database}\" < \"{$tempPath}\" 2>&1";
            exec($command, $output, $returnCode);

            if ($returnCode !== 0) {
                // Fallback: PHP-based import with proper charset setup
                DB::statement('SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci');
                DB::statement('SET CHARACTER SET utf8mb4');
                DB::statement('SET foreign_key_checks = 0');

                // Split on statement boundaries (semicolons not inside quotes)
                $statements = $this->splitSqlStatements($raw);
                foreach ($statements as $stmt) {
                    $stmt = trim($stmt);
                    if ($stmt !== '' && !str_starts_with($stmt, '--')) {
                        DB::unprepared($stmt);
                    }
                }

                DB::statement('SET foreign_key_checks = 1');
            }

            @unlink($tempPath);

            ActivityLog::create([
                'user_id' => $user->id,
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
            @unlink($tempPath);
            return response()->json([
                'success' => false,
                'message' => 'Import failed: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Split a SQL dump string into individual statements,
     * correctly handling quoted strings and comments.
     */
    private function splitSqlStatements(string $sql): array
    {
        $statements = [];
        $current    = '';
        $len        = strlen($sql);
        $inSingle   = false;
        $inDouble   = false;
        $inLineComment  = false;
        $inBlockComment = false;

        for ($i = 0; $i < $len; $i++) {
            $c    = $sql[$i];
            $next = $sql[$i + 1] ?? '';

            if ($inLineComment) {
                if ($c === "\n") $inLineComment = false;
                continue;
            }
            if ($inBlockComment) {
                if ($c === '*' && $next === '/') { $inBlockComment = false; $i++; }
                continue;
            }
            if (!$inSingle && !$inDouble && $c === '-' && $next === '-') {
                $inLineComment = true; continue;
            }
            if (!$inSingle && !$inDouble && $c === '/' && $next === '*') {
                $inBlockComment = true; $i++; continue;
            }
            if ($c === "'" && !$inDouble) {
                $inSingle = !$inSingle;
            } elseif ($c === '"' && !$inSingle) {
                $inDouble = !$inDouble;
            }
            if ($c === ';' && !$inSingle && !$inDouble) {
                $statements[] = $current;
                $current = '';
            } else {
                $current .= $c;
            }
        }
        if (trim($current) !== '') $statements[] = $current;
        return $statements;
    }

    /**
     * PHP-based SQL dump fallback when mysqldump is not available.
     */
    private function buildSqlDump(string $database): string
    {
        $sql = "-- OSCA System Database Backup\n";
        $sql .= "-- Generated: " . now()->toDateTimeString() . "\n";
        $sql .= "-- Database: {$database}\n\n";
        $sql .= "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;\n";
        $sql .= "SET CHARACTER SET utf8mb4;\n";
        $sql .= "SET FOREIGN_KEY_CHECKS=0;\n\n";

        $pdo    = DB::getPdo();
        $tables = DB::select('SHOW TABLES');
        $key    = "Tables_in_{$database}";

        foreach ($tables as $table) {
            $tableName = $table->$key;

            // CREATE TABLE
            $create = DB::select("SHOW CREATE TABLE `{$tableName}`");
            $sql .= "DROP TABLE IF EXISTS `{$tableName}`;\n";
            $sql .= $create[0]->{'Create Table'} . ";\n\n";

            // Detect BLOB columns — raw binary cannot be PDO::quote()'d safely
            $columns  = DB::select("SHOW COLUMNS FROM `{$tableName}`");
            $blobCols = [];
            $colNames = [];
            foreach ($columns as $col) {
                $colNames[] = $col->Field;
                if (stripos($col->Type, 'blob') !== false) {
                    $blobCols[] = $col->Field;
                }
            }

            // Build SELECT with HEX() for BLOB columns so binary data is safe
            $selectParts = array_map(function ($colName) use ($blobCols) {
                return in_array($colName, $blobCols)
                    ? "HEX(`{$colName}`) as `{$colName}`"
                    : "`{$colName}`";
            }, $colNames);
            $selectSql = 'SELECT ' . implode(', ', $selectParts) . " FROM `{$tableName}`";

            // INSERT rows — BLOB values use UNHEX(), everything else uses PDO::quote()
            $rows = DB::select($selectSql);
            foreach ($rows as $row) {
                $rowArr = (array) $row;
                $values = implode(', ', array_map(function ($colName) use ($rowArr, $pdo, $blobCols) {
                    $v = $rowArr[$colName];
                    if (is_null($v)) return 'NULL';
                    if (in_array($colName, $blobCols)) {
                        // HEX() returns uppercase hex string; wrap with UNHEX() for import
                        return "UNHEX('" . $v . "')";
                    }
                    return $pdo->quote((string) $v);
                }, $colNames));
                $sql .= "INSERT INTO `{$tableName}` VALUES ({$values});\n";
            }
            $sql .= "\n";
        }

        $sql .= "SET FOREIGN_KEY_CHECKS=1;\n";
        return $sql;
    }
}
