<?php

namespace Tests\Unit;

use App\Models\Senior;
use App\Models\User;
use App\Models\Request;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use PHPUnit\Framework\TestCase;

class RequestModelTest extends TestCase
{
    private Request $model;

    protected function setUp(): void
    {
        parent::setUp();
        $this->model = new Request();
    }

    public function test_fillable_contains_all_fields(): void
    {
        $expected = ['senior_id', 'type', 'status', 'pending_data', 'rejection_reason', 'action_by'];
        $this->assertEquals($expected, $this->model->getFillable());
    }

    public function test_fillable_does_not_contain_extra_fields(): void
    {
        $fillable = $this->model->getFillable();
        $this->assertCount(6, $fillable);
    }

    public function test_casts_has_pending_data_as_array(): void
    {
        $casts = $this->model->getCasts();
        $this->assertArrayHasKey('pending_data', $casts);
        $this->assertEquals('array', $casts['pending_data']);
    }

    public function test_casts_contains_only_expected_custom_entries(): void
    {
        $customCasts = array_filter(
            $this->model->getCasts(),
            fn(string $key) => $key !== 'id',
            ARRAY_FILTER_USE_KEY
        );
        $this->assertCount(1, $customCasts);
    }

    public function test_uses_has_factory_trait(): void
    {
        $this->assertTrue(in_array(HasFactory::class, class_uses(Request::class)));
    }

    public function test_does_not_use_soft_deletes(): void
    {
        $this->assertFalse(in_array('Illuminate\Database\Eloquent\SoftDeletes', class_uses(Request::class)));
    }

    public function test_senior_relationship_method_exists(): void
    {
        $this->assertTrue(method_exists($this->model, 'senior'));
    }

    public function test_senior_relationship_calls_belongs_to(): void
    {
        $method = new \ReflectionMethod(Request::class, 'senior');
        $source = $this->getMethodSource($method);
        $this->assertStringContainsString('belongsTo', $source);
        $this->assertStringContainsString(Senior::class, $source);
    }

    public function test_action_by_relationship_method_exists(): void
    {
        $this->assertTrue(method_exists($this->model, 'actionBy'));
    }

    public function test_action_by_relationship_calls_belongs_to_with_user_and_action_by_key(): void
    {
        $method = new \ReflectionMethod(Request::class, 'actionBy');
        $source = $this->getMethodSource($method);
        $this->assertStringContainsString('belongsTo', $source);
        $this->assertStringContainsString(User::class, $source);
        $this->assertStringContainsString("'action_by'", $source);
    }

    private function getMethodSource(\ReflectionMethod $method): string
    {
        $filename = $method->getFileName();
        $startLine = $method->getStartLine();
        $endLine = $method->getEndLine();
        $lines = file($filename);
        return implode('', array_slice($lines, $startLine - 1, $endLine - $startLine + 1));
    }
}
