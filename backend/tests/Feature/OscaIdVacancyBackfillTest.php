<?php

namespace Tests\Feature;

use App\Models\OscaIdVacancy;
use App\Models\Senior;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class OscaIdVacancyBackfillTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Carbon::setTestNow(Carbon::create(2026, 11, 14, 12, 0, 0));
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }

    private function makeSenior(array $overrides = []): Senior
    {
        return Senior::create(array_merge([
            'osca_id' => 'BACKFILL-' . uniqid(),
            'first_name' => 'Backfill',
            'middle_name' => null,
            'last_name' => 'Holder',
            'date_of_birth' => '1960-01-01',
            'age' => 66,
            'sex' => 'Male',
            'barangay' => 'Anibong',
            'street_address' => '123 Test St',
            'status' => 'Active',
        ], $overrides));
    }

    public function test_backfill_makes_existing_deceased_and_deleted_ids_available(): void
    {
        $active = $this->makeSenior(['osca_id' => 'BACKFILL-ACTIVE']);

        $deceased = $this->makeSenior([
            'osca_id' => 'BACKFILL-DECEASED',
            'first_name' => 'Deceased',
            'last_name' => 'Holder',
            'status' => 'Deceased',
        ]);
        DB::table('seniors')->where('id', $deceased->id)->update([
            'updated_at' => '2026-02-01 10:00:00',
        ]);

        $deleted = $this->makeSenior([
            'osca_id' => 'BACKFILL-DELETED',
            'first_name' => 'Deleted',
            'last_name' => 'Holder',
        ]);
        $deleted->delete();
        DB::table('seniors')->where('id', $deleted->id)->update([
            'deleted_at' => '2026-02-10 08:00:00',
        ]);

        $this->artisan('osca-ids:backfill-vacancies')->assertSuccessful();

        $active->refresh();
        $deceased->refresh();
        $deleted->refresh();

        $this->assertSame('BACKFILL-ACTIVE', $active->osca_id);
        $this->assertNull($active->former_osca_id);

        $this->assertNull($deceased->osca_id);
        $this->assertSame('BACKFILL-DECEASED', $deceased->former_osca_id);
        $this->assertNull($deleted->osca_id);
        $this->assertSame('BACKFILL-DELETED', $deleted->former_osca_id);

        $this->assertSame(2, OscaIdVacancy::count());

        $deceasedVacancy = OscaIdVacancy::where('osca_id', 'BACKFILL-DECEASED')->firstOrFail();
        $this->assertSame('Deceased', $deceasedVacancy->reason);
        $this->assertSame('Deceased Holder', $deceasedVacancy->past_holder_name);
        $this->assertSame('2026-02-01', $deceasedVacancy->vacated_at->format('Y-m-d'));

        $deletedVacancy = OscaIdVacancy::where('osca_id', 'BACKFILL-DELETED')->firstOrFail();
        $this->assertSame('Deleted', $deletedVacancy->reason);
        $this->assertSame('Deleted Holder', $deletedVacancy->past_holder_name);
        $this->assertSame('2026-02-10', $deletedVacancy->vacated_at->format('Y-m-d'));
    }

    public function test_backfill_is_idempotent(): void
    {
        $deceased = $this->makeSenior([
            'osca_id' => 'BACKFILL-TWICE',
            'status' => 'Deceased',
        ]);

        $this->artisan('osca-ids:backfill-vacancies')->assertSuccessful();
        $this->artisan('osca-ids:backfill-vacancies')->assertSuccessful();

        $this->assertSame(1, OscaIdVacancy::count());
        $this->assertSame('BACKFILL-TWICE', $deceased->fresh()->former_osca_id);
        $this->assertNull($deceased->fresh()->osca_id);
    }

    public function test_backfill_uses_the_deletion_date_when_a_deceased_record_was_also_deleted(): void
    {
        $senior = $this->makeSenior([
            'osca_id' => 'BACKFILL-BOTH',
            'status' => 'Deceased',
        ]);
        $senior->delete();
        DB::table('seniors')->where('id', $senior->id)->update([
            'deleted_at' => '2026-02-12 09:00:00',
        ]);

        $this->artisan('osca-ids:backfill-vacancies')->assertSuccessful();

        $vacancy = OscaIdVacancy::where('osca_id', 'BACKFILL-BOTH')->firstOrFail();
        $this->assertSame('Deleted', $vacancy->reason);
        $this->assertSame('2026-02-12', $vacancy->vacated_at->format('Y-m-d'));
    }
}
