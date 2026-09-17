<?php

namespace App\Services\Backup;

use App\Models\Request as SeniorRequest;
use App\Models\Senior;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Real database backup/restore logic for the OSCA system.
 *
 * Used by BackupController (HTTP, small files), the queued
 * BackupExportJob/BackupImportJob, and the `backup:restore` artisan command
 * (large files that cannot travel over HTTP/Cloudflare).
 *
 * Security notes:
 * - MySQL credentials are passed via a temporary `--defaults-extra-file`
 *   with 0600 permissions, NEVER via `--password=` on the command line
 *   (which would be visible to any local user in the process list).
 * - Every shell argument is escaped with escapeshellarg().
 * - Every import starts with a restorable snapshot unless explicitly skipped.
 */
class BackupService
{
    /** Browser uploads cap: 100 MB (Cloudflare free plan edge limit). */
    public const HTTP_MAX_KB = 102400;

    /** Directory (under storage/app/private) that holds safety snapshots. */
    public const SNAPSHOT_DIR = 'backups';

    /** How many snapshots to keep before pruning the oldest. */
    public const SNAPSHOTS_KEPT = 5;

    // ------------------------------------------------------------------
    // Public API
    // ------------------------------------------------------------------

    /**
     * Dump the whole database to $path (mysqldump, PHP fallback).
     *
     * @throws \RuntimeException when both strategies produce no output.
     */
    public function dumpToFile(string $path): string
    {
        $cfg = $this->connectionConfig();
        $dir = dirname($path);
        if (!is_dir($dir)) mkdir($dir, 0755, true);

        $mysqldump = $this->resolveBinaryPath('mysqldump');
        $defaultsFile = $this->writeDefaultsFile($cfg);

        try {
            $command = sprintf(
                '%s --defaults-extra-file=%s --single-transaction --routines --triggers %s > %s 2>&1',
                escapeshellcmd($mysqldump),
                escapeshellarg($defaultsFile),
                escapeshellarg($cfg['database']),
                escapeshellarg($path)
            );
            exec($command, $output, $returnCode);

            if ($returnCode !== 0 || !file_exists($path) || filesize($path) === 0) {
                file_put_contents($path, $this->buildSqlDump($cfg['database']));
            }
        } finally {
            @unlink($defaultsFile);
        }

        if (!file_exists($path) || filesize($path) === 0) {
            throw new \RuntimeException('Database backup failed. Both CLI and PHP fallback produced empty output.');
        }

        return $path;
    }

    /**
     * Take a safety snapshot before a destructive import. Returns its path.
     *
     * @throws \RuntimeException when the snapshot cannot be produced.
     */
    public function snapshot(string $label = 'pre-import'): string
    {
        $dir = storage_path('app/private/' . self::SNAPSHOT_DIR);
        if (!is_dir($dir)) mkdir($dir, 0755, true);

        $path = $dir . DIRECTORY_SEPARATOR . $label . '_' . date('Y-m-d_His') . '.sql';
        $this->dumpToFile($path);
        $this->pruneSnapshots();

        return $path;
    }

    /**
     * Restore the database from a .sql file (mysql CLI, PHP fallback).
     * Runs schema sync + imported-data compatibility afterwards.
     *
     * @throws \RuntimeException on failure (callers must surface the message).
     */
    public function restoreFromSqlFile(string $sqlPath, ?string $rawSql = null): void
    {
        if (!file_exists($sqlPath) || filesize($sqlPath) === 0) {
            throw new \RuntimeException('Backup file is missing or empty.');
        }

        $cfg = $this->connectionConfig();
        $mysql = $this->resolveBinaryPath('mysql');
        $defaultsFile = $this->writeDefaultsFile($cfg);

        try {
            $command = sprintf(
                '%s --defaults-extra-file=%s --default-character-set=utf8mb4 %s < %s 2>&1',
                escapeshellcmd($mysql),
                escapeshellarg($defaultsFile),
                escapeshellarg($cfg['database']),
                escapeshellarg($sqlPath)
            );
            exec($command, $output, $returnCode);

            if ($returnCode !== 0) {
                // Last-resort PHP importer (no DDL transactionality on MySQL:
                // a snapshot MUST exist before reaching this path).
                $this->phpImport($rawSql ?? file_get_contents($sqlPath));
            }
        } finally {
            @unlink($defaultsFile);
        }

        $migrationExitCode = Artisan::call('migrate', ['--force' => true]);
        if ($migrationExitCode !== 0) {
            throw new \RuntimeException('Database restored, but schema sync failed: ' . trim(Artisan::output()));
        }

        $this->ensureImportedSchemaCompatibility();
    }

    /**
     * Legacy entry points kept for the queued jobs (now real, not placeholders).
     */
    public function exportToFile(string $filename): string
    {
        return $this->dumpToFile(
            storage_path('app/private/' . self::SNAPSHOT_DIR . '/' . basename($filename))
        );
    }

    public function importFromFile(string $tempPath, int $userId): void
    {
        $this->snapshot('pre-import-async');
        $this->restoreFromSqlFile($tempPath);
    }

    // ------------------------------------------------------------------
    // Connection + secure credential handling
    // ------------------------------------------------------------------

    public function connectionConfig(): array
    {
        return [
            'database' => config('database.connections.mysql.database'),
            'username' => config('database.connections.mysql.username'),
            'password' => config('database.connections.mysql.password'),
            'host' => config('database.connections.mysql.host'),
            'port' => config('database.connections.mysql.port', 3306),
        ];
    }

    /**
     * Write a MySQL option file holding the credentials (0600) so secrets
     * never appear in process listings. Caller MUST unlink() the file.
     */
    public function writeDefaultsFile(array $cfg): string
    {
        $path = tempnam(sys_get_temp_dir(), 'osca-mycnf-');
        @chmod($path, 0600);
        $content = "[client]\n"
            . 'user="' . str_replace('"', '', (string) ($cfg['username'] ?? '')) . "\"\n"
            . 'password="' . str_replace(["\n", "\r", '"'], '', (string) ($cfg['password'] ?? '')) . "\"\n"
            . 'host="' . str_replace('"', '', (string) ($cfg['host'] ?? '127.0.0.1')) . "\"\n"
            . 'port="' . (int) ($cfg['port'] ?? 3306) . "\"\n";
        file_put_contents($path, $content);
        @chmod($path, 0600);

        return $path;
    }

    /**
     * Build the mysqldump command WITHOUT executing (test seam: asserts that
     * no secret travels on the command line). App-free so plain unit tests
     * can use it: pass $database explicitly when no app is booted.
     */
    public function dumpCommandFor(string $outputPath, ?string $defaultsFile = null, ?string $database = null): string
    {
        $database ??= app()->bound('config')
            ? (string) config('database.connections.mysql.database')
            : '[database]';

        return sprintf(
            '%s --defaults-extra-file=%s --single-transaction --routines --triggers %s > %s 2>&1',
            escapeshellcmd($this->resolveBinaryPath('mysqldump')),
            escapeshellarg($defaultsFile ?? '[defaults-file]'),
            escapeshellarg($database),
            escapeshellarg($outputPath)
        );
    }

    // ------------------------------------------------------------------
    // PHP fallback importer
    // ------------------------------------------------------------------

    private function phpImport(string $raw): void
    {
        DB::statement('SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci');
        DB::statement('SET CHARACTER SET utf8mb4');
        DB::statement('SET foreign_key_checks = 0');

        try {
            foreach ($this->splitSqlStatements($raw) as $stmt) {
                $stmt = trim($stmt);
                if ($stmt !== '' && !str_starts_with($stmt, '--')) {
                    DB::unprepared($this->prepareStatementForImport($stmt));
                }
            }
        } finally {
            DB::statement('SET foreign_key_checks = 1');
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

            if ($inSingle) {
                $current .= $c;

                if ($c === '\\' && $next !== '') {
                    $current .= $next;
                    $i++;
                    continue;
                }

                if ($c === "'") {
                    if ($next === "'") {
                        $current .= $next;
                        $i++;
                        continue;
                    }

                    $inSingle = false;
                }

                continue;
            }

            if ($inDouble) {
                $current .= $c;

                if ($c === '\\' && $next !== '') {
                    $current .= $next;
                    $i++;
                    continue;
                }

                if ($c === '"') {
                    if ($next === '"') {
                        $current .= $next;
                        $i++;
                        continue;
                    }

                    $inDouble = false;
                }

                continue;
            }

            if (!$inSingle && !$inDouble && $c === '-' && $next === '-') {
                $inLineComment = true; continue;
            }
            if (!$inSingle && !$inDouble && $c === '/' && $next === '*') {
                $inBlockComment = true; $i++; continue;
            }
            if ($c === "'" && !$inDouble) {
                $inSingle = true;
                $current .= $c;
                continue;
            }
            if ($c === '"' && !$inSingle) {
                $inDouble = true;
                $current .= $c;
                continue;
            }
            if ($c === ';' && !$inSingle && !$inDouble) {
                $statements[] = $current;
                $current = '';
            } else {
                $current .= $c;
            }
        }
        if (trim($current) !== '') $statements[] = $current;
        return array_values(array_filter($statements));
    }

    private function prepareStatementForImport(string $statement): string
    {
        if (!preg_match('/^INSERT\s+INTO\s+`?seniors`?/i', ltrim($statement))) {
            return $statement;
        }

        if (preg_match('/\bON\s+DUPLICATE\s+KEY\s+UPDATE\b/i', $statement)) {
            return $statement;
        }

        $columns = $this->extractInsertColumns($statement);
        if ($columns === []) {
            $columns = Schema::getColumnListing('seniors');
        }

        $updatableColumns = array_values(array_filter($columns, fn (string $column) => $column !== 'id'));
        if ($updatableColumns === []) {
            return $statement;
        }

        $assignments = implode(', ', array_map(function (string $column) {
            $escapedColumn = str_replace('`', '', $column);

            return "`{$escapedColumn}` = VALUES(`{$escapedColumn}`)";
        }, $updatableColumns));

        return rtrim($statement, "; \t\n\r\0\x0B") . ' ON DUPLICATE KEY UPDATE ' . $assignments;
    }

    private function extractInsertColumns(string $statement): array
    {
        if (!preg_match('/^INSERT\s+INTO\s+`?seniors`?\s*\(([^)]+)\)/i', ltrim($statement), $matches)) {
            return [];
        }

        return array_values(array_filter(array_map(function (string $column) {
            return trim($column, " `\t\n\r\0\x0B");
        }, explode(',', $matches[1]))));
    }

    // ------------------------------------------------------------------
    // Post-restore compatibility (moved verbatim from BackupController)
    // ------------------------------------------------------------------

    public function ensureImportedSchemaCompatibility(): void
    {
        if (!Schema::hasTable('seniors')) {
            return;
        }

        if (!Schema::hasColumn('seniors', 'deleted_at')) {
            Schema::table('seniors', function (Blueprint $table) {
                $table->softDeletes();
            });
        }

        // Ensure pension_status enum includes 'None' (needed for imported data)
        try {
            $colType = DB::selectOne("SELECT COLUMN_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'seniors' AND COLUMN_NAME = 'pension_status'")->COLUMN_TYPE ?? '';
            if (stripos($colType, "'None'") === false) {
                DB::statement("ALTER TABLE seniors MODIFY COLUMN pension_status ENUM('Indigent','Pensioner','National Social Pensioner','Local Social Pensioner','None') DEFAULT 'Indigent'");
            }
        } catch (\Exception $e) {
            // Silently continue — enum likely already correct
        }

        // Clean imported data: strip Excel float artifacts and normalize imported defaults.
        $this->normalizeImportedOscaIds();
        DB::statement("UPDATE seniors SET rrn = REPLACE(rrn, '.0', '') WHERE rrn LIKE '%.0'");
        DB::statement("UPDATE seniors SET contact_number = REPLACE(contact_number, '.0', '') WHERE contact_number LIKE '%.0'");
        DB::statement("UPDATE seniors SET created_at = '2025-06-30 00:00:00' WHERE created_at IS NULL");
        DB::statement("UPDATE seniors SET updated_at = '2025-06-30 00:00:00' WHERE updated_at IS NULL");

        // Seniors without an assigned OSCA ID should remain visible in approval.
        DB::statement("UPDATE seniors SET status = 'Pending' WHERE (osca_id IS NULL OR TRIM(osca_id) = '') AND status = 'Active'");
        $this->ensurePendingApprovalRequests();

        // Imported accounts without a password stay UNABLE to log in (NULL
        // password) until an admin sets an initial password at approval time.
        if (!Schema::hasColumn('seniors', 'force_password_change')) {
            Schema::table('seniors', function (Blueprint $table) {
                $table->boolean('force_password_change')->default(false)->after('password');
            });
        }

        DB::update(
            "UPDATE seniors SET password = NULL, force_password_change = 1 WHERE password IS NULL OR TRIM(password) = ''"
        );
    }

    private function ensurePendingApprovalRequests(): void
    {
        $pendingSeniorIdsWithRequests = SeniorRequest::query()
            ->where('status', 'Pending')
            ->pluck('senior_id')
            ->all();

        Senior::query()
            ->where('status', 'Pending')
            ->where(function ($query) {
                $query->whereNull('osca_id')
                    ->orWhereRaw("TRIM(osca_id) = ''");
            })
            ->when($pendingSeniorIdsWithRequests !== [], function ($query) use ($pendingSeniorIdsWithRequests) {
                $query->whereNotIn('id', $pendingSeniorIdsWithRequests);
            })
            ->orderBy('id')
            ->get(['id'])
            ->each(function (Senior $senior) {
                SeniorRequest::create([
                    'senior_id' => $senior->id,
                    'type' => 'New Application',
                    'status' => 'Pending',
                ]);
            });
    }

    private function normalizeImportedOscaIds(): void
    {
        $seniors = Senior::query()
            ->orderBy('id')
            ->get(['id', 'osca_id', 'status']);

        $groupedByNormalizedOscaId = [];

        foreach ($seniors as $senior) {
            $normalizedOscaId = $senior->osca_id !== null
                ? preg_replace('/\.0$/', '', trim((string) $senior->osca_id))
                : null;

            if ($normalizedOscaId === '') {
                $normalizedOscaId = null;
            }

            $groupedByNormalizedOscaId[$normalizedOscaId ?? '__null__'][] = [
                'id' => $senior->id,
                'original' => $senior->osca_id,
                'normalized' => $normalizedOscaId,
                'status' => $senior->status,
            ];
        }

        foreach ($groupedByNormalizedOscaId as $groupKey => $group) {
            if ($groupKey === '__null__') {
                foreach ($group as $row) {
                    $updates = [];

                    if ($row['original'] !== null) {
                        $updates['osca_id'] = null;
                    }

                    if ($row['status'] === 'Active') {
                        $updates['status'] = 'Pending';
                    }

                    if ($updates !== []) {
                        DB::table('seniors')->where('id', $row['id'])->update($updates);
                    }
                }

                continue;
            }

            $keeper = collect($group)->first(fn (array $row) => $row['original'] === $row['normalized'])
                ?? $group[0];

            foreach ($group as $row) {
                $updates = [];

                if ($row['id'] === $keeper['id']) {
                    if ($row['original'] !== $row['normalized']) {
                        $updates['osca_id'] = $row['normalized'];
                    }
                } else {
                    $updates['osca_id'] = null;
                    $updates['status'] = 'Pending';
                }

                if ($updates !== []) {
                    DB::table('seniors')->where('id', $row['id'])->update($updates);
                }
            }
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

    private function pruneSnapshots(): void
    {
        $dir = storage_path('app/private/' . self::SNAPSHOT_DIR);
        $files = glob($dir . DIRECTORY_SEPARATOR . '*.sql') ?: [];
        usort($files, fn ($a, $b) => filemtime($b) <=> filemtime($a));
        foreach (array_slice($files, self::SNAPSHOTS_KEPT) as $old) {
            @unlink($old);
        }
    }

    /**
     * Locate the binary executable (mysqldump or mysql), checking .env, common XAMPP/WAMP/Laragon paths, and PATH.
     */
    private function resolveBinaryPath(string $binary): string
    {
        // 1. Check if configured in .env (e.g. MYSQLDUMP_PATH or MYSQL_PATH)
        $envKey = strtoupper($binary) . '_PATH';
        if ($envPath = env($envKey)) {
            if (file_exists($envPath)) {
                return $envPath;
            }
        }

        // 2. Check standard Windows XAMPP / Laragon installation directories
        $candidates = [
            'C:\\xampp\\mysql\\bin\\' . $binary . '.exe',
            'D:\\xampp\\mysql\\bin\\' . $binary . '.exe',
            'E:\\xampp\\mysql\\bin\\' . $binary . '.exe',
            'C:\\laragon\\bin\\mysql\\mysql-8.0\\bin\\' . $binary . '.exe',
            'C:\\laragon\\bin\\mysql\\current\\bin\\' . $binary . '.exe',
        ];

        foreach ($candidates as $candidate) {
            if (file_exists($candidate)) {
                return $candidate;
            }
        }

        // Check wildcard patterns for dynamic versions (e.g. Program Files or WAMP)
        $wildcards = [
            'C:\\Program Files\\MySQL\\MySQL Server *\\bin\\' . $binary . '.exe',
            'C:\\wamp64\\bin\\mysql\\mysql*\\bin\\' . $binary . '.exe',
        ];

        foreach ($wildcards as $pattern) {
            $matches = glob($pattern);
            if (!empty($matches)) {
                $match = end($matches);
                if (file_exists($match)) {
                    return $match;
                }
            }
        }

        // 3. Check if binary is in system PATH
        $isWindows = strtoupper(substr(PHP_OS, 0, 3)) === 'WIN';
        $checkCmd = $isWindows ? "where {$binary} 2>nul" : "which {$binary} 2>/dev/null";
        $output = [];
        $returnCode = 1;
        @exec($checkCmd, $output, $returnCode);
        if ($returnCode === 0 && !empty($output[0])) {
            $path = trim($output[0]);
            if (file_exists($path)) {
                return $path;
            }
        }

        // 4. Fallback to plain binary name
        return $binary;
    }
}
