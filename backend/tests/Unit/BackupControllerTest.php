<?php

namespace Tests\Unit;

use App\Http\Controllers\Api\BackupController;
use PHPUnit\Framework\TestCase;
use ReflectionMethod;

class BackupControllerTest extends TestCase
{
    public function test_split_sql_statements_keeps_semicolons_inside_escaped_single_quoted_values(): void
    {
        $controller = new BackupController();
        $method = new ReflectionMethod($controller, 'splitSqlStatements');
        $method->setAccessible(true);

        $sql = <<<'SQL'
INSERT INTO seniors VALUES ('6494', '3492', 'FLORAIDA', 'DE LEON', 'VOLUNTATE', NULL, '1956-07-20', '69', NULL, 'Female', NULL, 'None', 'Sampaloc', 'NAT\'L HIGHWAY BRGY. SAMPALOC', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', NULL, NULL, NULL, NULL, NULL, NULL, 'Active', 'hash', '1', '2025-06-30 00:00:00', '2025-06-30 00:00:00', NULL);
INSERT INTO users (id, name, email) VALUES (1, 'Admin', 'admin@example.com');
SQL;

        $statements = $method->invoke($controller, $sql);

        $this->assertCount(2, $statements);
        $this->assertStringContainsString("NAT\\'L HIGHWAY BRGY. SAMPALOC", $statements[0]);
        $this->assertStringContainsString("Mozilla/5.0 (Windows NT 10.0; Win64; x64)", $statements[0]);
        $this->assertStringContainsString('INSERT INTO users', $statements[1]);
    }

    public function test_prepare_statement_for_import_converts_senior_insert_to_upsert(): void
    {
        $controller = new BackupController();
        $method = new ReflectionMethod($controller, 'prepareStatementForImport');
        $method->setAccessible(true);

        $statement = "INSERT INTO seniors (id, first_name, last_name, osca_id, status) VALUES (10, 'NEDITA', 'RAYMUNDO', '0002', 'Active');";
        $prepared = $method->invoke($controller, $statement);

        $this->assertStringContainsString('ON DUPLICATE KEY UPDATE', $prepared);
        $this->assertStringContainsString('`first_name` = VALUES(`first_name`)', $prepared);
        $this->assertStringContainsString('`osca_id` = VALUES(`osca_id`)', $prepared);
        $this->assertStringNotContainsString('`id` = VALUES(`id`)', $prepared);
    }

    public function test_prepare_statement_for_import_leaves_other_tables_unchanged(): void
    {
        $controller = new BackupController();
        $method = new ReflectionMethod($controller, 'prepareStatementForImport');
        $method->setAccessible(true);

        $statement = "INSERT INTO users (id, name, email) VALUES (1, 'Admin', 'admin@example.com');";

        $this->assertSame($statement, $method->invoke($controller, $statement));
    }
}