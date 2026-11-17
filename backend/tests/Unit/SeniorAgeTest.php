<?php

namespace Tests\Unit;

use App\Models\Senior;
use Illuminate\Support\Carbon;
use Tests\TestCase;

/**
 * One shared rule for resolving a senior's age:
 * - a real date of birth always wins;
 * - the imported placeholder date 1900-01-01 is not a real birthdate;
 * - a stored age is used as a fallback only when it is humanly plausible.
 */
class SeniorAgeTest extends TestCase
{
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

    private function senior(array $attributes): Senior
    {
        $senior = new Senior();
        $senior->setRawAttributes($attributes, true);

        return $senior;
    }

    public function test_placeholder_birthdate_is_not_a_known_birthdate(): void
    {
        $senior = $this->senior(['date_of_birth' => '1900-01-01', 'age' => 88]);

        $this->assertFalse($senior->hasKnownDateOfBirth());
    }

    public function test_real_birthdate_is_a_known_birthdate(): void
    {
        $senior = $this->senior(['date_of_birth' => '1923-01-02', 'age' => 103]);

        $this->assertTrue($senior->hasKnownDateOfBirth());
    }

    public function test_missing_birthdate_is_not_a_known_birthdate(): void
    {
        $senior = $this->senior(['date_of_birth' => null, 'age' => 70]);

        $this->assertFalse($senior->hasKnownDateOfBirth());
    }

    public function test_resolved_age_uses_a_real_birthdate_instead_of_the_stored_age(): void
    {
        $senior = $this->senior(['date_of_birth' => '1955-06-15', 'age' => 99]);

        $this->assertSame(71, $senior->resolvedAge());
    }

    public function test_resolved_age_falls_back_to_a_plausible_stored_age_for_the_placeholder(): void
    {
        $senior = $this->senior(['date_of_birth' => '1900-01-01', 'age' => 88]);

        $this->assertSame(88, $senior->resolvedAge());
    }

    public function test_resolved_age_is_unknown_for_an_impossible_stored_age(): void
    {
        $senior = $this->senior(['date_of_birth' => '1900-01-01', 'age' => 126]);

        $this->assertNull($senior->resolvedAge());
    }

    public function test_is_centenarian_requires_a_real_birthdate(): void
    {
        $placeholder = $this->senior(['date_of_birth' => '1900-01-01', 'age' => 126]);
        $real = $this->senior(['date_of_birth' => '1923-01-02', 'age' => 103]);

        $this->assertFalse($placeholder->isCentenarian());
        $this->assertTrue($real->isCentenarian());
    }

    public function test_is_centenarian_excludes_a_99_year_old(): void
    {
        $senior = $this->senior(['date_of_birth' => '1927-01-01', 'age' => 99]);

        $this->assertFalse($senior->isCentenarian());
    }
}
