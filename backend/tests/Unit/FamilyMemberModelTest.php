<?php

namespace Tests\Unit;

use App\Models\Senior;
use App\Models\FamilyMember;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use PHPUnit\Framework\TestCase;

class FamilyMemberModelTest extends TestCase
{
    private FamilyMember $model;

    protected function setUp(): void
    {
        parent::setUp();
        $this->model = new FamilyMember();
    }

    public function test_fillable_contains_all_fields(): void
    {
        $expected = ['senior_id', 'name', 'relationship', 'age', 'civil_status', 'occupation', 'income'];
        $this->assertEquals($expected, $this->model->getFillable());
    }

    public function test_fillable_does_not_contain_extra_fields(): void
    {
        $fillable = $this->model->getFillable();
        $this->assertCount(7, $fillable);
    }

    public function test_uses_has_factory_trait(): void
    {
        $this->assertTrue(in_array(HasFactory::class, class_uses(FamilyMember::class)));
    }

    public function test_does_not_use_soft_deletes(): void
    {
        $this->assertFalse(in_array('Illuminate\Database\Eloquent\SoftDeletes', class_uses(FamilyMember::class)));
    }

    public function test_senior_relationship_method_exists(): void
    {
        $this->assertTrue(method_exists($this->model, 'senior'));
    }

    public function test_senior_relationship_calls_belongs_to(): void
    {
        $method = new \ReflectionMethod(FamilyMember::class, 'senior');
        $source = $this->getMethodSource($method);
        $this->assertStringContainsString('belongsTo', $source);
        $this->assertStringContainsString(Senior::class, $source);
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
