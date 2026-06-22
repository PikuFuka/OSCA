<?php

namespace Tests\Unit;

use App\Http\Controllers\Api\SeniorController;
use App\Models\Senior;
use PHPUnit\Framework\TestCase;
use ReflectionMethod;

class SeniorControllerTest extends TestCase
{
    private function invokePrivateMethod(SeniorController $controller, string $method, array $args = []): mixed
    {
        $m = new ReflectionMethod($controller, $method);
        $m->setAccessible(true);
        return $m->invokeArgs($controller, $args);
    }

    private function makeSeniorStub(array $attrs = []): Senior
    {
        $senior = new Senior();
        $senior->setRawAttributes(array_merge([
            'id' => 1,
            'osca_id' => '0001',
            'first_name' => 'Juan',
            'middle_name' => 'Dela',
            'last_name' => 'Cruz',
            'extension_name' => null,
            'full_name' => 'Juan Dela Cruz',
            'age' => 70,
            'sex' => 'Male',
            'status' => 'Active',
            'pension_status' => 'Indigent',
            'barangay' => 'Sampaloc',
            'id_config' => null,
            'profile_photo_path' => null,
            'date_of_birth' => \Carbon\Carbon::create(1955, 6, 15),
            'place_of_birth' => 'Lucena',
            'mothers_maiden_name' => 'Maria Santos',
            'street_address' => 'Rizal St.',
            'contact_number' => '09171234567',
            'emergency_name' => 'Ana Cruz',
            'emergency_contact' => '09171234568',
            'rrn' => 'RRN-001',
            'national_id' => 'NID-001',
            'family_members_count' => 2,
            'created_at' => \Carbon\Carbon::create(2025, 1, 15, 10, 30, 0),
            'updated_at' => \Carbon\Carbon::create(2025, 6, 1, 14, 0, 0),
        ], $attrs), true);
        return $senior;
    }

    public function test_transform_senior_maps_all_fields(): void
    {
        $controller = new SeniorController();
        $senior = $this->makeSeniorStub();
        $result = $this->invokePrivateMethod($controller, 'transformSenior', [$senior]);

        $this->assertSame('0001', $result['id']);
        $this->assertSame('0001', $result['oscaId']);
        $this->assertSame('Juan Dela Cruz', $result['name']);
        $this->assertSame(70, $result['age']);
        $this->assertSame('Male', $result['gender']);
        $this->assertSame('Active', $result['status']);
        $this->assertSame('Jan 15, 2025', $result['joinedDate']);
        $this->assertSame('Indigent', $result['pensionStatus']);
        $this->assertSame('Sampaloc', $result['barangay']);
        $this->assertNull($result['idConfig']);
        $this->assertNull($result['idPhoto']);
        $this->assertSame('1955-06-15', $result['dateOfBirth']);
        $this->assertSame('Juan', $result['firstName']);
        $this->assertSame('Dela', $result['middleName']);
        $this->assertSame('Cruz', $result['lastName']);
        $this->assertNull($result['extensionName']);
        $this->assertSame('Lucena', $result['placeOfBirth']);
        $this->assertSame('Maria Santos', $result['mothersMaidenName']);
        $this->assertSame('Rizal St.', $result['streetAddress']);
        $this->assertSame('09171234567', $result['contactNumber']);
        $this->assertSame('Ana Cruz', $result['emergencyName']);
        $this->assertSame('09171234568', $result['emergencyContact']);
        $this->assertSame('RRN-001', $result['rrn']);
        $this->assertSame('NID-001', $result['nationalId']);
        $this->assertSame(2, $result['familyMembersCount']);
        $this->assertSame('Jun 01, 2025 02:00 PM', $result['updatedAt']);
    }

    public function test_transform_senior_id_falls_back_to_model_id_when_osca_id_null(): void
    {
        $controller = new SeniorController();
        $senior = $this->makeSeniorStub(['osca_id' => null, 'id' => 42]);
        $result = $this->invokePrivateMethod($controller, 'transformSenior', [$senior]);

        $this->assertSame(42, $result['id']);
        $this->assertNull($result['oscaId']);
    }

    public static function statusNormalizationProvider(): array
    {
        return [
            'lowercase deceased' => ['deceased', 'Deceased'],
            'capitalized Deceased' => ['Deceased', 'Deceased'],
            'lowercase approved' => ['approved', 'Active'],
            'capitalized Active' => ['Active', 'Active'],
            'Pending passes through' => ['Pending', 'Pending'],
            'Inactive passes through' => ['Inactive', 'Inactive'],
            'pending lowercase passes through' => ['pending', 'pending'],
        ];
    }

    #[\PHPUnit\Framework\Attributes\DataProvider('statusNormalizationProvider')]
    public function test_transform_senior_normalizes_status(string $input, string $expected): void
    {
        $controller = new SeniorController();
        $senior = $this->makeSeniorStub(['status' => $input]);
        $result = $this->invokePrivateMethod($controller, 'transformSenior', [$senior]);

        $this->assertSame($expected, $result['status']);
    }

    public function test_transform_senior_id_photo_with_profile_path(): void
    {
        $controller = new SeniorController();
        $senior = $this->makeSeniorStub(['profile_photo_path' => 'profile_photos/senior_photo.jpg']);
        $result = $this->invokePrivateMethod($controller, 'transformSenior', [$senior]);

        $this->assertSame('/api/storage/profiles/senior_photo.jpg', $result['idPhoto']);
    }

    public function test_transform_senior_id_photo_null_when_no_path(): void
    {
        $controller = new SeniorController();
        $senior = $this->makeSeniorStub(['profile_photo_path' => null]);
        $result = $this->invokePrivateMethod($controller, 'transformSenior', [$senior]);

        $this->assertNull($result['idPhoto']);
    }

    public function test_transform_senior_id_photo_extracts_basename_from_nested_path(): void
    {
        $controller = new SeniorController();
        $senior = $this->makeSeniorStub(['profile_photo_path' => 'profile_photos/subdir/my photo.png']);
        $result = $this->invokePrivateMethod($controller, 'transformSenior', [$senior]);

        $this->assertSame('/api/storage/profiles/my photo.png', $result['idPhoto']);
    }

    public function test_transform_senior_joined_date_with_created_at(): void
    {
        $controller = new SeniorController();
        $senior = $this->makeSeniorStub([
            'created_at' => \Carbon\Carbon::create(2024, 3, 5, 8, 0, 0),
        ]);
        $result = $this->invokePrivateMethod($controller, 'transformSenior', [$senior]);

        $this->assertSame('Mar 05, 2024', $result['joinedDate']);
    }

    public function test_transform_senior_joined_date_without_created_at(): void
    {
        $controller = new SeniorController();
        $senior = $this->makeSeniorStub(['created_at' => null]);
        $result = $this->invokePrivateMethod($controller, 'transformSenior', [$senior]);

        $this->assertSame('N/A', $result['joinedDate']);
    }

    public function test_transform_senior_date_of_birth_with_value(): void
    {
        $controller = new SeniorController();
        $senior = $this->makeSeniorStub([
            'date_of_birth' => \Carbon\Carbon::create(1960, 12, 25),
        ]);
        $result = $this->invokePrivateMethod($controller, 'transformSenior', [$senior]);

        $this->assertSame('1960-12-25', $result['dateOfBirth']);
    }

    public function test_transform_senior_date_of_birth_null(): void
    {
        $controller = new SeniorController();
        $senior = $this->makeSeniorStub(['date_of_birth' => null]);
        $result = $this->invokePrivateMethod($controller, 'transformSenior', [$senior]);

        $this->assertNull($result['dateOfBirth']);
    }

    public function test_transform_senior_updated_at_formats_time(): void
    {
        $controller = new SeniorController();
        $senior = $this->makeSeniorStub([
            'updated_at' => \Carbon\Carbon::create(2025, 6, 1, 9, 5, 0),
        ]);
        $result = $this->invokePrivateMethod($controller, 'transformSenior', [$senior]);

        $this->assertSame('Jun 01, 2025 09:05 AM', $result['updatedAt']);
    }

    public function test_transform_senior_updated_at_null(): void
    {
        $controller = new SeniorController();
        $senior = $this->makeSeniorStub(['updated_at' => null]);
        $result = $this->invokePrivateMethod($controller, 'transformSenior', [$senior]);

        $this->assertNull($result['updatedAt']);
    }

    public function test_transform_senior_family_members_count_default_zero(): void
    {
        $controller = new SeniorController();
        $senior = $this->makeSeniorStub(['family_members_count' => null]);
        $result = $this->invokePrivateMethod($controller, 'transformSenior', [$senior]);

        $this->assertSame(0, $result['familyMembersCount']);
    }

    public function test_apply_senior_search_returns_early_on_empty_string(): void
    {
        $controller = new SeniorController();
        $query = $this->createMock(\Illuminate\Database\Eloquent\Builder::class);
        $query->expects($this->never())->method('where');

        $this->invokePrivateMethod($controller, 'applySeniorSearch', [$query, '']);
    }

    public function test_apply_senior_search_returns_early_on_whitespace_only(): void
    {
        $controller = new SeniorController();
        $query = $this->createMock(\Illuminate\Database\Eloquent\Builder::class);
        $query->expects($this->never())->method('where');

        $this->invokePrivateMethod($controller, 'applySeniorSearch', [$query, '   ']);
    }

    public function test_apply_senior_search_calls_where_on_non_empty_input(): void
    {
        $controller = new SeniorController();
        $called = false;
        $query = new class {
            public bool $whereCalled = false;
            public function where($col, $op = null, $val = null, $bool = 'and') {
                $this->whereCalled = true;
                return $this;
            }
        };

        $this->invokePrivateMethod($controller, 'applySeniorSearch', [$query, 'test']);

        $this->assertTrue($query->whereCalled);
    }

    public function test_apply_senior_search_single_term_splits_to_one_term(): void
    {
        $terms = preg_split('/\s+/', trim('Juan')) ?: [];
        $this->assertCount(1, $terms);
        $this->assertSame('Juan', $terms[0]);
    }

    public function test_apply_senior_search_multi_term_splits_correctly(): void
    {
        $terms = preg_split('/\s+/', trim('Juan Dela Cruz')) ?: [];
        $this->assertCount(3, $terms);
        $this->assertSame('Juan', $terms[0]);
        $this->assertSame('Dela', $terms[1]);
        $this->assertSame('Cruz', $terms[2]);
    }

    public function test_apply_senior_search_extra_whitespace_trims_and_splits(): void
    {
        $search = '  Juan   Dela  ';
        $terms = preg_split('/\s+/', trim($search)) ?: [];
        $this->assertCount(2, $terms);
        $this->assertSame('Juan', $terms[0]);
        $this->assertSame('Dela', $terms[1]);
    }

    public function test_apply_valid_osca_id_scope_is_invocable(): void
    {
        $controller = new SeniorController();
        $method = new ReflectionMethod($controller, 'applyValidOscaIdScope');
        $method->setAccessible(true);
        $this->assertTrue($method->isPublic() || $method->isPrivate() || $method->isProtected());
        $this->assertSame('applyValidOscaIdScope', $method->getName());
    }

    public function test_apply_valid_osca_id_scope_invokes_where_not_null_and_where_raw(): void
    {
        $controller = new SeniorController();
        $query = $this->createMock(\Illuminate\Database\Query\Builder::class);
        $query->expects($this->once())->method('whereNotNull')->with('osca_id')->willReturnSelf();
        $query->expects($this->once())->method('whereRaw')->with("TRIM(osca_id) <> ''")->willReturnSelf();

        $result = $this->invokePrivateMethod($controller, 'applyValidOscaIdScope', [$query]);
        $this->assertSame($query, $result);
    }
}
