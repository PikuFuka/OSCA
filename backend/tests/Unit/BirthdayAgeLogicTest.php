<?php

namespace Tests\Unit;

use App\Console\Commands\UpdateBirthdayAges;
use App\Http\Controllers\Api\SeniorController;
use App\Models\Senior;
use Illuminate\Support\Carbon;
use PHPUnit\Framework\TestCase;

class BirthdayAgeLogicTest extends TestCase
{
    public function test_age_increases_by_one_on_birthday(): void
    {
        // Birthday on September 16, 1960
        $dob = Carbon::create(1960, 9, 16);

        // Day before birthday in 2026: age is 65
        Carbon::setTestNow(Carbon::create(2026, 9, 15, 23, 59, 59));
        $ageBefore = Carbon::parse($dob)->age;
        $this->assertEquals(65, $ageBefore);

        // On birthday in 2026: age is 66 (added 1)
        Carbon::setTestNow(Carbon::create(2026, 9, 16, 0, 0, 0));
        $ageOnBirthday = Carbon::parse($dob)->age;
        $this->assertEquals(66, $ageOnBirthday);

        // Clean up test now
        Carbon::setTestNow();
    }

    public function test_update_birthday_ages_command_signature_and_description(): void
    {
        $command = new UpdateBirthdayAges();
        $this->assertEquals('seniors:update-birthday-ages', $command->getName());
        $this->assertNotEmpty($command->getDescription());
    }

    public function test_controller_has_birthdays_method(): void
    {
        $controller = new SeniorController();
        $this->assertTrue(method_exists($controller, 'birthdays'));
    }
}
