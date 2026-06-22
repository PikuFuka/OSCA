<?php

namespace Tests\Unit;

use App\Models\ActivityLog;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use PHPUnit\Framework\TestCase;

class ActivityLogModelTest extends TestCase
{
    private ActivityLog $model;

    protected function setUp(): void
    {
        parent::setUp();
        $this->model = new ActivityLog();
    }

    public function test_fillable_contains_all_fields(): void
    {
        $expected = ['user_id', 'action', 'target_type', 'target_id', 'details', 'ip_address'];
        $this->assertEquals($expected, $this->model->getFillable());
    }

    public function test_fillable_does_not_contain_extra_fields(): void
    {
        $fillable = $this->model->getFillable();
        $this->assertCount(6, $fillable);
    }

    public function test_casts_has_details_as_array(): void
    {
        $casts = $this->model->getCasts();
        $this->assertArrayHasKey('details', $casts);
        $this->assertEquals('array', $casts['details']);
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
        $this->assertTrue(in_array(HasFactory::class, class_uses(ActivityLog::class)));
    }

    public function test_does_not_use_soft_deletes(): void
    {
        $this->assertFalse(in_array('Illuminate\Database\Eloquent\SoftDeletes', class_uses(ActivityLog::class)));
    }

    public function test_user_relationship_method_exists(): void
    {
        $this->assertTrue(method_exists($this->model, 'user'));
    }

    public function test_user_relationship_calls_belongs_to(): void
    {
        $method = new \ReflectionMethod(ActivityLog::class, 'user');
        $source = $this->getMethodSource($method);
        $this->assertStringContainsString('belongsTo', $source);
        $this->assertStringContainsString(User::class, $source);
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
