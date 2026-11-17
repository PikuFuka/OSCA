<?php

namespace Tests\Feature;

use App\Models\Senior;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class UpdateBirthdayAgesCommandTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        // Day before the real record's birthday.
        Carbon::setTestNow(Carbon::create(2026, 6, 14, 12, 0, 0));
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }

    private function insertSenior(array $overrides = []): Senior
    {
        $id = DB::table('seniors')->insertGetId(array_merge([
            'osca_id' => 'CMD-' . uniqid(),
            'first_name' => 'Command',
            'last_name' => 'Test',
            'date_of_birth' => '1960-01-01',
            'age' => 66,
            'sex' => 'Male',
            'barangay' => 'Anibong',
            'street_address' => '123 Test St',
            'status' => 'Active',
            'created_at' => now(),
            'updated_at' => now(),
        ], $overrides));

        return Senior::findOrFail($id);
    }

    public function test_command_updates_real_birthdates_but_skips_the_placeholder_birthdate(): void
    {
        $real = $this->insertSenior(['date_of_birth' => '1955-06-15', 'age' => 60]);
        $placeholder = $this->insertSenior(['date_of_birth' => '1900-01-01', 'age' => 88]);

        $this->artisan('seniors:update-birthday-ages')->assertSuccessful();

        $this->assertSame(70, (int) $real->fresh()->age);
        $this->assertSame(88, (int) $placeholder->fresh()->age);
    }
}
