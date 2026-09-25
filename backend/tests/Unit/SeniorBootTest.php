<?php

namespace Tests\Unit;

use App\Models\Senior;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\TestCase;

/**
 * Senior model boot hooks must stay sqlite-safe:
 * the osca_id_trim sync is guarded for MySQL and must be
 * silently ignored on sqlite instead of breaking saves.
 */
class SeniorBootTest extends TestCase
{
    use RefreshDatabase;

    private function baseAttributes(array $overrides = []): array
    {
        return array_merge([
            'osca_id' => 'OSCA-' . uniqid(),
            'first_name' => 'Boot',
            'last_name' => 'Test',
            'date_of_birth' => '1960-06-06',
            'age' => 66,
            'sex' => 'Male',
            'barangay' => 'Biñan',
            'street_address' => '123 Test St',
            'status' => 'Active',
        ], $overrides);
    }

    public function test_save_succeeds_on_sqlite_without_osca_id_trim_column(): void
    {
        $senior = Senior::create($this->baseAttributes());

        $this->assertDatabaseHas('seniors', ['id' => $senior->id]);
    }

    public function test_osca_id_whitespace_is_trimmed_and_empty_becomes_null(): void
    {
        $senior = Senior::create($this->baseAttributes(['osca_id' => '   ']));
        $this->assertNull($senior->fresh()->osca_id);

        $senior2 = Senior::create($this->baseAttributes(['osca_id' => '  OSCA-PADDED  ']));
        $this->assertSame('OSCA-PADDED', $senior2->fresh()->osca_id);
    }

    public function test_age_is_recalculated_when_date_of_birth_changes(): void
    {
        $senior = Senior::create($this->baseAttributes());
        $senior->update(['date_of_birth' => '1950-01-01']);

        $this->assertSame(Carbon::parse('1950-01-01')->age, (int) $senior->fresh()->age);
    }

    public function test_full_name_accessor_joins_present_parts_only(): void
    {
        $senior = new Senior([
            'first_name' => 'Juan',
            'middle_name' => null,
            'last_name' => 'Dela Cruz',
            'extension_name' => 'Jr.',
        ]);

        $this->assertSame('Juan Dela Cruz Jr.', $senior->full_name);
    }

    public function test_full_name_is_appended_in_serialization(): void
    {
        $senior = Senior::create($this->baseAttributes([
            'first_name' => 'Maria',
            'middle_name' => 'Reyes',
            'last_name' => 'Santos',
        ]));

        $this->assertSame('Maria Reyes Santos', $senior->fresh()->toArray()['full_name']);
    }
}
