<?php

namespace Tests\Unit;

use App\Services\Backup\BackupService;
use PHPUnit\Framework\TestCase;
use ReflectionMethod;

class BackupControllerTest extends TestCase
{
    public function test_split_sql_statements_keeps_semicolons_inside_escaped_single_quoted_values(): void
    {
        $service = new BackupService();
        $method = new ReflectionMethod($service, 'splitSqlStatements');
        $method->setAccessible(true);

        $sql = <<<'SQL'
INSERT INTO seniors VALUES ('6494', '3492', 'FLORAIDA', 'DE LEON', 'VOLUNTATE', NULL, '1956-07-20', '69', NULL, 'Female', NULL, 'None', 'Sampaloc', 'NAT\'L HIGHWAY BRGY. SAMPALOC', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', NULL, NULL, NULL, NULL, NULL, NULL, 'Active', 'hash', '1', '2025-06-30 00:00:00', '2025-06-30 00:00:00', NULL);
INSERT INTO users (id, name, email) VALUES (1, 'Admin', 'admin@example.com');
SQL;

        $statements = $method->invoke($service, $sql);

        $this->assertCount(2, $statements);
        $this->assertStringContainsString("NAT\\'L HIGHWAY BRGY. SAMPALOC", $statements[0]);
        $this->assertStringContainsString("Mozilla/5.0 (Windows NT 10.0; Win64; x64)", $statements[0]);
        $this->assertStringContainsString('INSERT INTO users', $statements[1]);
    }

    public function test_prepare_statement_for_import_converts_senior_insert_to_upsert(): void
    {
        $service = new BackupService();
        $method = new ReflectionMethod($service, 'prepareStatementForImport');
        $method->setAccessible(true);

        $statement = "INSERT INTO seniors (id, first_name, last_name, osca_id, status) VALUES (10, 'NEDITA', 'RAYMUNDO', '0002', 'Active');";
        $prepared = $method->invoke($service, $statement);

        $this->assertStringContainsString('ON DUPLICATE KEY UPDATE', $prepared);
        $this->assertStringContainsString('`first_name` = VALUES(`first_name`)', $prepared);
        $this->assertStringContainsString('`osca_id` = VALUES(`osca_id`)', $prepared);
        $this->assertStringNotContainsString('`id` = VALUES(`id`)', $prepared);
    }

    public function test_prepare_statement_for_import_leaves_other_tables_unchanged(): void
    {
        $service = new BackupService();
        $method = new ReflectionMethod($service, 'prepareStatementForImport');
        $method->setAccessible(true);

        $statement = "INSERT INTO users (id, name, email) VALUES (1, 'Admin', 'admin@example.com');";

        $this->assertSame($statement, $method->invoke($service, $statement));
    }

    public function test_extract_insert_columns_parses_column_list(): void
    {
        $service = new BackupService();
        $method = new ReflectionMethod($service, 'extractInsertColumns');
        $method->setAccessible(true);

        $result = $method->invoke($service, "INSERT INTO seniors (id, first_name, last_name) VALUES (1, 'John', 'Doe')");

        $this->assertSame(['id', 'first_name', 'last_name'], $result);
    }

    public function test_extract_insert_columns_strips_backticks(): void
    {
        $service = new BackupService();
        $method = new ReflectionMethod($service, 'extractInsertColumns');
        $method->setAccessible(true);

        $result = $method->invoke($service, "INSERT INTO `seniors` (`id`, `first_name`) VALUES (1, 'John')");

        $this->assertSame(['id', 'first_name'], $result);
    }

    public function test_extract_insert_columns_returns_empty_without_column_list(): void
    {
        $service = new BackupService();
        $method = new ReflectionMethod($service, 'extractInsertColumns');
        $method->setAccessible(true);

        $result = $method->invoke($service, "INSERT INTO seniors VALUES (1, 'John', 'Doe')");

        $this->assertSame([], $result);
    }

    public function test_extract_insert_columns_returns_empty_for_non_seniors_table(): void
    {
        $service = new BackupService();
        $method = new ReflectionMethod($service, 'extractInsertColumns');
        $method->setAccessible(true);

        $result = $method->invoke($service, "INSERT INTO users (id, name) VALUES (1, 'Admin')");

        $this->assertSame([], $result);
    }

    public function test_extract_insert_columns_trims_whitespace_around_columns(): void
    {
        $service = new BackupService();
        $method = new ReflectionMethod($service, 'extractInsertColumns');
        $method->setAccessible(true);

        $result = $method->invoke($service, "INSERT INTO seniors ( id , first_name , last_name ) VALUES (1, 'John', 'Doe')");

        $this->assertSame(['id', 'first_name', 'last_name'], $result);
    }

    public static function splitSqlStatementsEdgeCaseProvider(): array
    {
        return [
            'empty input' => ['', []],
            'only whitespace' => ['   ', []],
            'only line comment' => ['-- this is a comment', []],
            'only block comment' => ['/* block comment */', []],
            'consecutive semicolons' => [';;', []],
            'semicolon then statement' => [';INSERT INTO t VALUES (1);', ['INSERT INTO t VALUES (1)']],
        ];
    }

    #[\PHPUnit\Framework\Attributes\DataProvider('splitSqlStatementsEdgeCaseProvider')]
    public function test_split_sql_statements_edge_cases(string $input, array $expected): void
    {
        $service = new BackupService();
        $method = new ReflectionMethod($service, 'splitSqlStatements');
        $method->setAccessible(true);

        $statements = $method->invoke($service, $input);
        $this->assertSame($expected, $statements);
    }

    public function test_split_sql_statements_double_quoted_string_with_semicolon(): void
    {
        $service = new BackupService();
        $method = new ReflectionMethod($service, 'splitSqlStatements');
        $method->setAccessible(true);

        $sql = 'INSERT INTO t VALUES ("val;ue");';
        $statements = $method->invoke($service, $sql);

        $this->assertCount(1, $statements);
        $this->assertStringContainsString('val;ue', $statements[0]);
    }

    public function test_split_sql_statements_block_comment_with_semicolon(): void
    {
        $service = new BackupService();
        $method = new ReflectionMethod($service, 'splitSqlStatements');
        $method->setAccessible(true);

        $sql = "/* comment; with semicolon */ INSERT INTO t VALUES (1);";
        $statements = $method->invoke($service, $sql);

        $this->assertCount(1, $statements);
        $this->assertStringContainsString('INSERT INTO t', $statements[0]);
    }

    public function test_split_sql_statements_line_comment_with_semicolon(): void
    {
        $service = new BackupService();
        $method = new ReflectionMethod($service, 'splitSqlStatements');
        $method->setAccessible(true);

        $sql = "-- comment; with semicolon\nINSERT INTO t VALUES (1);";
        $statements = $method->invoke($service, $sql);

        $this->assertCount(1, $statements);
        $this->assertStringContainsString('INSERT INTO t', $statements[0]);
    }

    public function test_split_sql_statements_utf8_bom_prefix(): void
    {
        $service = new BackupService();
        $method = new ReflectionMethod($service, 'splitSqlStatements');
        $method->setAccessible(true);

        $bom = "\xEF\xBB\xBF";
        $sql = $bom . "INSERT INTO t VALUES (1);";
        $statements = $method->invoke($service, $sql);

        $this->assertCount(1, $statements);
    }

    public function test_split_sql_statements_consecutive_semicolons_discard_empty(): void
    {
        $service = new BackupService();
        $method = new ReflectionMethod($service, 'splitSqlStatements');
        $method->setAccessible(true);

        $sql = "INSERT INTO t VALUES (1);;INSERT INTO t VALUES (2);";
        $statements = $method->invoke($service, $sql);

        $this->assertCount(2, $statements);
    }

    public function test_prepare_statement_for_import_skips_if_on_duplicate_key_update_present(): void
    {
        $service = new BackupService();
        $method = new ReflectionMethod($service, 'prepareStatementForImport');
        $method->setAccessible(true);

        $statement = "INSERT INTO seniors (id, first_name) VALUES (1, 'John') ON DUPLICATE KEY UPDATE first_name = 'John'";

        $this->assertSame($statement, $method->invoke($service, $statement));
    }

    public function test_prepare_statement_for_import_leaves_non_insert_unchanged(): void
    {
        $service = new BackupService();
        $method = new ReflectionMethod($service, 'prepareStatementForImport');
        $method->setAccessible(true);

        $statement = "UPDATE seniors SET first_name = 'John' WHERE id = 1;";

        $this->assertSame($statement, $method->invoke($service, $statement));
    }

    public function test_prepare_statement_for_import_handles_backtick_table_name(): void
    {
        $service = new BackupService();
        $method = new ReflectionMethod($service, 'prepareStatementForImport');
        $method->setAccessible(true);

        $statement = "INSERT INTO `seniors` (`id`, `first_name`, `osca_id`) VALUES (1, 'Nedy', '0003');";
        $prepared = $method->invoke($service, $statement);

        $this->assertStringContainsString('ON DUPLICATE KEY UPDATE', $prepared);
        $this->assertStringContainsString('`first_name` = VALUES(`first_name`)', $prepared);
        $this->assertStringNotContainsString('`id` = VALUES(`id`)', $prepared);
    }

    public function test_dump_command_never_carries_password_on_command_line(): void
    {
        $service = new BackupService();
        $command = $service->dumpCommandFor('/tmp/osca_test.sql', null, 'osca_db');

        $this->assertStringContainsString('--defaults-extra-file=', $command);
        $this->assertStringNotContainsString('--password', $command);
        $this->assertStringNotContainsString('MYSQL_PWD', $command);
    }

    public function test_defaults_file_holds_credentials_with_restricted_permissions(): void
    {
        $service = new BackupService();
        $path = $service->writeDefaultsFile([
            'database' => 'osca_db',
            'username' => 'root',
            'password' => 's3cret-value',
            'host' => '127.0.0.1',
            'port' => 3306,
        ]);

        try {
            $content = file_get_contents($path);
            $this->assertStringContainsString('[client]', $content);
            $this->assertStringContainsString('s3cret-value', $content);
            if (DIRECTORY_SEPARATOR === '\\') {
                // Windows ignores chmod mode bits; temp files inherit the
                // user-private %TEMP% ACL instead — assert that placement
                // (case-insensitive: temp paths may use 8.3 short names).
                $realPath = realpath($path) ?: $path;
                $realTemp = realpath(sys_get_temp_dir()) ?: sys_get_temp_dir();
                $this->assertTrue(
                    str_starts_with(strtolower($realPath), strtolower(rtrim($realTemp, '\\/'))),
                    'Defaults file must live in the user-private temp dir'
                );
            } else {
                $perms = fileperms($path) & 0777;
                $this->assertSame(0, $perms & 0077, 'Defaults file must not be group/other accessible');
            }
        } finally {
            @unlink($path);
        }
    }

    public function test_http_upload_cap_matches_cloudflare_edge_limit(): void
    {
        $this->assertSame(102400, BackupService::HTTP_MAX_KB);
    }
}