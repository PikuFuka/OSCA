<?php

namespace Tests\Unit;

use App\Models\Senior;
use App\Models\SeniorDocument;
use App\Models\FamilyMember;
use App\Models\Request;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Laravel\Sanctum\HasApiTokens;
use PHPUnit\Framework\TestCase;

class SeniorModelTest extends TestCase
{
    private Senior $model;

    protected function setUp(): void
    {
        parent::setUp();
        $this->model = new Senior();
    }

    public function test_fillable_contains_all_fields(): void
    {
        $expected = [
            'osca_id', 'first_name', 'middle_name', 'last_name', 'extension_name',
            'date_of_birth', 'age', 'place_of_birth', 'sex', 'mothers_maiden_name',
            'pension_status', 'barangay', 'street_address', 'contact_number',
            'emergency_name', 'emergency_contact', 'rrn', 'national_id',
            'profile_photo_path', 'id_config', 'status', 'password', 'force_password_change',
        ];
        $this->assertEquals($expected, $this->model->getFillable());
    }

    public function test_fillable_count(): void
    {
        $this->assertCount(23, $this->model->getFillable());
    }

    public function test_hidden_contains_password(): void
    {
        $this->assertContains('password', $this->model->getHidden());
    }

    public function test_hidden_only_contains_password(): void
    {
        $this->assertEquals(['password'], $this->model->getHidden());
    }

    public function test_casts_date_of_birth_as_date(): void
    {
        $casts = $this->model->getCasts();
        $this->assertArrayHasKey('date_of_birth', $casts);
        $this->assertEquals('date', $casts['date_of_birth']);
    }

    public function test_casts_id_config_as_array(): void
    {
        $casts = $this->model->getCasts();
        $this->assertArrayHasKey('id_config', $casts);
        $this->assertEquals('array', $casts['id_config']);
    }

    public function test_casts_password_as_hashed(): void
    {
        $casts = $this->model->getCasts();
        $this->assertArrayHasKey('password', $casts);
        $this->assertEquals('hashed', $casts['password']);
    }

    public function test_appends_contains_full_name(): void
    {
        $this->assertContains('full_name', $this->model->getAppends());
    }

    public function test_uses_has_api_tokens_trait(): void
    {
        $this->assertTrue(in_array(HasApiTokens::class, class_uses(Senior::class)));
    }

    public function test_uses_has_factory_trait(): void
    {
        $this->assertTrue(in_array(HasFactory::class, class_uses(Senior::class)));
    }

    public function test_uses_soft_deletes_trait(): void
    {
        $this->assertTrue(in_array(SoftDeletes::class, class_uses(Senior::class)));
    }

    public function test_full_name_accessor_with_all_name_parts(): void
    {
        $senior = new Senior();
        $senior->first_name = 'Juan';
        $senior->middle_name = 'Santos';
        $senior->last_name = 'Dela Cruz';
        $senior->extension_name = 'Jr.';

        $this->assertEquals('Juan Santos Dela Cruz Jr.', $senior->getFullNameAttribute());
    }

    public function test_full_name_accessor_with_first_and_last_only(): void
    {
        $senior = new Senior();
        $senior->first_name = 'Juan';
        $senior->middle_name = null;
        $senior->last_name = 'Dela Cruz';
        $senior->extension_name = null;

        $this->assertEquals('Juan Dela Cruz', $senior->getFullNameAttribute());
    }

    public function test_full_name_accessor_with_first_middle_last_no_extension(): void
    {
        $senior = new Senior();
        $senior->first_name = 'Maria';
        $senior->middle_name = 'Reyes';
        $senior->last_name = 'Santos';
        $senior->extension_name = null;

        $this->assertEquals('Maria Reyes Santos', $senior->getFullNameAttribute());
    }

    public function test_full_name_accessor_with_empty_middle_name(): void
    {
        $senior = new Senior();
        $senior->first_name = 'Juan';
        $senior->middle_name = '';
        $senior->last_name = 'Dela Cruz';
        $senior->extension_name = null;

        $this->assertEquals('Juan Dela Cruz', $senior->getFullNameAttribute());
    }

    public function test_full_name_accessor_with_empty_extension_name(): void
    {
        $senior = new Senior();
        $senior->first_name = 'Juan';
        $senior->middle_name = 'Santos';
        $senior->last_name = 'Dela Cruz';
        $senior->extension_name = '';

        $this->assertEquals('Juan Santos Dela Cruz', $senior->getFullNameAttribute());
    }

    public function test_full_name_accessor_with_first_last_and_extension(): void
    {
        $senior = new Senior();
        $senior->first_name = 'Juan';
        $senior->middle_name = null;
        $senior->last_name = 'Dela Cruz';
        $senior->extension_name = 'Sr.';

        $this->assertEquals('Juan Dela Cruz Sr.', $senior->getFullNameAttribute());
    }

    public function test_full_name_accessor_accessible_via_attribute(): void
    {
        $senior = new Senior();
        $senior->first_name = 'Juan';
        $senior->middle_name = null;
        $senior->last_name = 'Dela Cruz';
        $senior->extension_name = null;

        $this->assertEquals('Juan Dela Cruz', $senior->full_name);
    }

    public static function fullNameProvider(): array
    {
        return [
            'all parts present' => ['Juan', 'Santos', 'Dela Cruz', 'Jr.', 'Juan Santos Dela Cruz Jr.'],
            'no middle no extension' => ['Juan', null, 'Dela Cruz', null, 'Juan Dela Cruz'],
            'middle but no extension' => ['Maria', 'Reyes', 'Santos', null, 'Maria Reyes Santos'],
            'extension but no middle' => ['Juan', null, 'Dela Cruz', 'Sr.', 'Juan Dela Cruz Sr.'],
            'empty middle empty extension' => ['Juan', '', 'Dela Cruz', '', 'Juan Dela Cruz'],
        ];
    }

    #[\PHPUnit\Framework\Attributes\DataProvider('fullNameProvider')]
    public function test_full_name_accessor_with_data_provider(
        string $firstName,
        ?string $middleName,
        string $lastName,
        ?string $extensionName,
        string $expected,
    ): void {
        $senior = new Senior();
        $senior->first_name = $firstName;
        $senior->middle_name = $middleName;
        $senior->last_name = $lastName;
        $senior->extension_name = $extensionName;

        $this->assertEquals($expected, $senior->full_name);
    }

    public function test_family_members_relationship_method_exists(): void
    {
        $this->assertTrue(method_exists($this->model, 'familyMembers'));
    }

    public function test_family_members_relationship_calls_has_many(): void
    {
        $method = new \ReflectionMethod(Senior::class, 'familyMembers');
        $source = $this->getMethodSource($method);
        $this->assertStringContainsString('hasMany', $source);
        $this->assertStringContainsString(FamilyMember::class, $source);
    }

    public function test_documents_relationship_method_exists(): void
    {
        $this->assertTrue(method_exists($this->model, 'documents'));
    }

    public function test_documents_relationship_calls_has_many(): void
    {
        $method = new \ReflectionMethod(Senior::class, 'documents');
        $source = $this->getMethodSource($method);
        $this->assertStringContainsString('hasMany', $source);
        $this->assertStringContainsString(SeniorDocument::class, $source);
    }

    public function test_requests_relationship_method_exists(): void
    {
        $this->assertTrue(method_exists($this->model, 'requests'));
    }

    public function test_requests_relationship_calls_has_many(): void
    {
        $method = new \ReflectionMethod(Senior::class, 'requests');
        $source = $this->getMethodSource($method);
        $this->assertStringContainsString('hasMany', $source);
        $this->assertStringContainsString(Request::class, $source);
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
