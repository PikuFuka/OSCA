<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Request as SeniorRequest;
use App\Models\Senior;
use Illuminate\Http\Request;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schema;

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

        $database = config('database.connections.mysql.database');
        $username = config('database.connections.mysql.username');
        $password = config('database.connections.mysql.password');
        $host     = config('database.connections.mysql.host');
        $port     = config('database.connections.mysql.port', 3306);

        $filename = 'osca_backup_' . date('Y-m-d_His') . '.sql';
        $tempPath = storage_path('app/' . $filename);

        // Build mysqldump command
        $passwordArg = $password !== null && $password !== ''
            ? "--password=\"{$password}\""
            : '';
        $command = escapeshellarg($this->resolveMysqlBinary('mysqldump')) . " --user=\"{$username}\" {$passwordArg} --host=\"{$host}\" --port={$port} --single-transaction --routines --triggers \"{$database}\" > \"{$tempPath}\" 2>&1";

        exec($command, $output, $returnCode);

        if ($returnCode !== 0 || !file_exists($tempPath) || filesize($tempPath) === 0) {
            // Fallback: build SQL from PHP if mysqldump is unavailable
            $sql = $this->buildSqlDump($database);
            file_put_contents($tempPath, $sql);
        }

        // Validate the file before serving
        if (!file_exists($tempPath) || filesize($tempPath) === 0) {
            return response()->json(['message' => 'Database backup failed. Both CLI and PHP fallback produced empty output.'], 500);
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

        try {
            $database = config('database.connections.mysql.database');
            $username = config('database.connections.mysql.username');
            $password = config('database.connections.mysql.password');
            $host     = config('database.connections.mysql.host');
            $port     = config('database.connections.mysql.port', 3306);

            // Try mysql CLI first — it handles charsets natively with --default-character-set.
            // Non-strict SQL mode matches mysqldump restores and lets legacy dumps write
            // values to generated columns (MariaDB warning 1906, ignored, not fatal).
            $passwordArg = $password !== null && $password !== ''
                ? "--password=\"{$password}\""
                : '';
            $mysql = escapeshellarg($this->resolveMysqlBinary('mysql'));
            $command = "{$mysql} --user=\"{$username}\" {$passwordArg} --host=\"{$host}\" --port={$port} --default-character-set=utf8mb4 --init-command=\"SET SESSION sql_mode='NO_AUTO_VALUE_ON_ZERO'\" \"{$database}\" < \"{$tempPath}\" 2>&1";
            exec($command, $output, $returnCode);

            if ($returnCode !== 0) {
                // Fallback: PHP-based import with proper charset setup
                DB::statement('SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci');
                DB::statement('SET CHARACTER SET utf8mb4');
                DB::statement('SET foreign_key_checks = 0');

                // Laravel connections enable STRICT_TRANS_TABLES, which turns MariaDB
                // warning 1906 into an error when a dump supplies a value for a
                // generated column. Relax it for the restore, then restore it after.
                $originalSqlMode = $this->currentSqlMode();
                $this->applySqlMode($this->withoutStrictModes($originalSqlMode));

                try {
                    // Split on statement boundaries (semicolons not inside quotes)
                    $statements = $this->splitSqlStatements($raw);
                    foreach ($statements as $stmt) {
                        $stmt = trim($stmt);
                        if ($stmt !== '' && !str_starts_with($stmt, '--')) {
                            DB::unprepared($this->prepareStatementForImport($stmt));
                        }
                    }
                } finally {
                    $this->applySqlMode($originalSqlMode);
                    DB::statement('SET foreign_key_checks = 1');
                }
            }

            $migrationExitCode = Artisan::call('migrate', ['--force' => true]);
            if ($migrationExitCode !== 0) {
                throw new \RuntimeException('Database restored, but schema sync failed: ' . trim(Artisan::output()));
            }

            $this->ensureImportedSchemaCompatibility();

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
        // mysqldump uses DELIMITER directives around routines and triggers.
        // The mysql client handles them, but the PHP fallback must normalize
        // their terminators before splitting statements.
        $sql = $this->normalizeDumpDelimiters($sql);

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
                if (($sql[$i + 2] ?? '') === '!') {
                    $current .= '/*';
                    $i++;
                    continue;
                }
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
        return array_values(array_map(
            static fn (string $statement): string => str_replace("\x1E", ';', $statement),
            array_filter($statements)
        ));
    }

    private function normalizeDumpDelimiters(string $sql): string
    {
        $protectedSemicolon = "\x1E";
        $delimiter = ';';
        $lines = preg_split('/\R/', $sql) ?: [];
        $normalized = [];

        foreach ($lines as $line) {
            if (preg_match('/^[ \t]*DELIMITER[ \t]+([^\s]+)[ \t]*$/i', $line, $matches)) {
                $delimiter = $matches[1];
                continue;
            }

            if ($delimiter === ';') {
                $normalized[] = $line;
                continue;
            }

            $trimmed = rtrim($line);
            if (str_ends_with($trimmed, $delimiter)) {
                $body = substr($trimmed, 0, -strlen($delimiter));
                $normalized[] = str_replace(';', $protectedSemicolon, $body) . ';';
            } else {
                $normalized[] = str_replace(';', $protectedSemicolon, $line);
            }
        }

        return implode("\n", $normalized);
    }

    /** @var array<string, list<string>> */
    private array $generatedColumns = [];

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

        // Generated columns cannot be assigned; including them in ON DUPLICATE KEY
        // UPDATE makes MariaDB fail with error 1906 even when the INSERT is valid.
        $generatedColumns = $this->getGeneratedColumns('seniors');

        $updatableColumns = array_values(array_filter(
            $columns,
            fn (string $column) => $column !== 'id' && !in_array($column, $generatedColumns, true)
        ));
        if ($updatableColumns === []) {
            return $statement;
        }

        $assignments = implode(', ', array_map(function (string $column) {
            $escapedColumn = str_replace('`', '', $column);

            return "`{$escapedColumn}` = VALUES(`{$escapedColumn}`)";
        }, $updatableColumns));

        return rtrim($statement, "; \t\n\r\0\x0B") . ' ON DUPLICATE KEY UPDATE ' . $assignments;
    }

    /**
     * List generated (virtual/stored) columns for a table.
     *
     * Introspection is best-effort: unit tests and non-MySQL connections
     * simply return no generated columns.
     *
     * @return list<string>
     */
    protected function getGeneratedColumns(string $table): array
    {
        if (array_key_exists($table, $this->generatedColumns)) {
            return $this->generatedColumns[$table];
        }

        try {
            $columns = Schema::getColumns($table);
        } catch (\Throwable $e) {
            return $this->generatedColumns[$table] = [];
        }

        $generated = [];
        foreach ($columns as $column) {
            if (!empty($column['generation'])) {
                $generated[] = $column['name'];
            }
        }

        return $this->generatedColumns[$table] = $generated;
    }

    /**
     * Current session SQL mode, or null when it cannot be read.
     */
    private function currentSqlMode(): ?string
    {
        try {
            $result = DB::selectOne('SELECT @@SESSION.sql_mode AS sql_mode');

            return $result?->sql_mode !== null ? (string) $result->sql_mode : null;
        } catch (\Throwable $e) {
            return null;
        }
    }

    /**
     * Remove strict-mode flags while keeping the rest of the SQL mode intact.
     */
    private function withoutStrictModes(?string $sqlMode): ?string
    {
        if ($sqlMode === null) {
            return null;
        }

        $strictModes = ['STRICT_TRANS_TABLES', 'STRICT_ALL_TABLES'];
        $modes = array_filter(
            array_map('trim', explode(',', $sqlMode)),
            static fn (string $mode) => $mode !== '' && !in_array($mode, $strictModes, true)
        );

        return implode(',', $modes);
    }

    private function applySqlMode(?string $sqlMode): void
    {
        if ($sqlMode === null) {
            return;
        }

        DB::statement('SET SESSION sql_mode = ' . DB::getPdo()->quote($sqlMode));
    }

    /**
     * Resolve a MySQL client binary, falling back to common XAMPP/MySQL paths
     * when the binaries are not on PATH.
     */
    private function resolveMysqlBinary(string $binary): string
    {
        $candidates = DIRECTORY_SEPARATOR === '\\'
            ? [
                "C:\\xampp\\mysql\\bin\\{$binary}.exe",
                "C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\{$binary}.exe",
                "C:\\Program Files\\MySQL\\MySQL Server 8.4\\bin\\{$binary}.exe",
            ]
            : [
                "/usr/bin/{$binary}",
                "/usr/local/bin/{$binary}",
                "/Applications/XAMPP/xamppfiles/bin/{$binary}",
                "/opt/lampp/bin/{$binary}",
            ];

        foreach ($candidates as $candidate) {
            if (is_file($candidate)) {
                return $candidate;
            }
        }

        return $binary;
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

    private function ensureImportedSchemaCompatibility(): void
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

        // Set default password for imported seniors without one and require a password change.
        if (!Schema::hasColumn('seniors', 'force_password_change')) {
            Schema::table('seniors', function (Blueprint $table) {
                $table->boolean('force_password_change')->default(false)->after('password');
            });
        }

        $defaultHash = bcrypt('qwerty123.');
        DB::update(
            "UPDATE seniors SET password = ?, force_password_change = 1 WHERE password IS NULL OR TRIM(password) = ''",
            [$defaultHash]
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
        $sql .= "SET SESSION sql_mode = 'NO_AUTO_VALUE_ON_ZERO';\n";
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
