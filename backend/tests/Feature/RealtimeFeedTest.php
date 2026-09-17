<?php

namespace Tests\Feature;

use App\Models\Senior;
use App\Support\RealtimeFeed;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RealtimeFeedTest extends TestCase
{
    use RefreshDatabase;

    private function makeSenior(array $overrides = []): Senior
    {
        return Senior::create(array_merge([
            'first_name' => 'Feed',
            'last_name' => 'Probe',
            'date_of_birth' => '1950-06-15',
            'age' => 76,
            'sex' => 'Female',
            'barangay' => 'Test Barangay',
            'street_address' => '1 Test St',
            'status' => 'Pending',
        ], $overrides));
    }

    public function test_sequence_bumps_on_create_update_and_delete(): void
    {
        $this->assertSame(0, RealtimeFeed::seq());

        $senior = $this->makeSenior();
        $this->assertSame(1, RealtimeFeed::seq());

        $senior->update(['barangay' => 'Other Barangay']);
        $this->assertSame(2, RealtimeFeed::seq());

        $senior->delete();
        $this->assertSame(3, RealtimeFeed::seq());
    }

    public function test_baseline_and_changed_since_flow(): void
    {
        $baseline = RealtimeFeed::baseline();
        $this->assertFalse(RealtimeFeed::changedSince($baseline));

        $this->makeSenior();
        $this->assertTrue(RealtimeFeed::changedSince($baseline));

        $fresh = RealtimeFeed::baseline();
        $this->assertFalse(RealtimeFeed::changedSince($fresh));
    }
}
