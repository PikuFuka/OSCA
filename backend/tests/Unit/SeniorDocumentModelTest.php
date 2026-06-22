<?php

namespace Tests\Unit;

use App\Models\Senior;
use App\Models\SeniorDocument;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use PHPUnit\Framework\TestCase;

class SeniorDocumentModelTest extends TestCase
{
    private SeniorDocument $model;

    protected function setUp(): void
    {
        parent::setUp();
        $this->model = new SeniorDocument();
    }

    public function test_fillable_contains_all_fields(): void
    {
        $expected = ['senior_id', 'document_type', 'file_content', 'file_name', 'mime_type', 'file_size'];
        $this->assertEquals($expected, $this->model->getFillable());
    }

    public function test_fillable_does_not_contain_extra_fields(): void
    {
        $fillable = $this->model->getFillable();
        $this->assertCount(6, $fillable);
    }

    public function test_uses_has_factory_trait(): void
    {
        $this->assertTrue(in_array(HasFactory::class, class_uses(SeniorDocument::class)));
    }

    public function test_does_not_use_soft_deletes(): void
    {
        $this->assertFalse(in_array('Illuminate\Database\Eloquent\SoftDeletes', class_uses(SeniorDocument::class)));
    }

    public function test_scope_without_content_method_exists(): void
    {
        $this->assertTrue(method_exists($this->model, 'scopeWithoutContent'));
    }

    public function test_scope_without_content_excludes_file_content(): void
    {
        $method = new \ReflectionMethod(SeniorDocument::class, 'scopeWithoutContent');
        $source = $this->getMethodSource($method);

        $includedColumns = ['id', 'senior_id', 'document_type', 'file_name', 'mime_type', 'file_size', 'created_at', 'updated_at'];
        foreach ($includedColumns as $column) {
            $this->assertStringContainsString("'{$column}'", $source);
        }

        $this->assertStringNotContainsString("'file_content'", $source);
    }

    public function test_senior_relationship_method_exists(): void
    {
        $this->assertTrue(method_exists($this->model, 'senior'));
    }

    public function test_senior_relationship_calls_belongs_to(): void
    {
        $method = new \ReflectionMethod(SeniorDocument::class, 'senior');
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
