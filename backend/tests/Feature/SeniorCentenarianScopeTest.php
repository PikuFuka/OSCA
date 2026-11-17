<?php

namespace Tests\Feature;

use App\Models\Senior;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\TestCase;

class SeniorCentenarianScopeTest extends TestCase
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
            'osca_id' => 'CENT-' . uniqid(),
            'first_name' => 'Centenarian',
            'last_name' => 'Scope',
            'date_of_birth' => '1960-01-01',
            'age' => 66,
            'sex' => 'Female',
            'barangay' => 'Anibong',
            'street_address' => '123 Test St',
            'status' => 'Active',
        ], $overrides));
    }

    public function test_centenarian_scope_counts_only_real_birthdates_aged_100_or_more(): void
    {
        $this->makeSenior(['date_of_birth' => '1923-01-02', 'age' => 103]);
        $this->makeSenior(['date_of_birth' => '1926-11-14', 'age' => 100]);
        $this->makeSenior(['date_of_birth' => '1927-01-01', 'age' => 99]);
        $this->makeSenior(['date_of_birth' => '1900-01-01', 'age' => 126]);

        $this->assertSame(2, Senior::query()->centenarians()->count());
    }

    public function test_centenarian_scope_can_be_combined_with_the_active_filter(): void
    {
        $this->makeSenior(['date_of_birth' => '1923-01-02', 'age' => 103, 'status' => 'Active']);
        $this->makeSenior(['date_of_birth' => '1923-01-02', 'age' => 103, 'status' => 'Deceased']);

        $this->assertSame(1, Senior::query()->where('status', 'Active')->centenarians()->count());
    }

    public function test_plausible_age_scope_excludes_only_impossible_placeholder_ages(): void
    {
        $this->makeSenior(['date_of_birth' => '1900-01-01', 'age' => 88]);
        $this->makeSenior(['date_of_birth' => '1900-01-01', 'age' => 126]);
        $this->makeSenior(['date_of_birth' => '1923-01-02', 'age' => 103]);

        $this->assertSame(2, Senior::query()->plausibleAge()->count());
    }
}
