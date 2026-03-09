<?php

namespace Tests\Unit;

use App\Http\Controllers\Api\BackupController;
use PHPUnit\Framework\TestCase;
use ReflectionMethod;

class BackupControllerTest extends TestCase
{
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