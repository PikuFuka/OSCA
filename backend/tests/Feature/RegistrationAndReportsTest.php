<?php

namespace Tests\Feature;

use App\Models\Senior;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class RegistrationAndReportsTest extends TestCase
{
    use RefreshDatabase;

    /** Fresh auth boundary per call (the test app outlives single requests). */
    private function freshRequest(?string $token = null): static
    {
        $this->app['auth']->forgetGuards();
        if ($token === null) {
            unset($this->defaultHeaders['Authorization']);
            return $this;
        }

        return $this->withHeader('Authorization', 'Bearer ' . $token);
    }

    private function validRegistration(array $overrides = []): array
    {
        return array_merge([
            'firstName' => 'Reg',
            'lastName' => 'Probe-' . uniqid(),
            'dateOfBirth' => '1950-06-15',
            'age' => 76,
            'sex' => 'Female',
            'pensionStatus' => 'Indigent',
            'barangay' => 'Test Barangay',
            'streetAddress' => '1 Test St',
        ], $overrides);
    }

    public function test_public_registration_validates_required_fields(): void
    {
        $this->postJson('/api/register', [])->assertStatus(422);
    }

    public function test_public_registration_rejects_underage_applicants(): void
    {
        $this->postJson('/api/register', $this->validRegistration([
            'age' => 59,
            'dateOfBirth' => '1967-01-01',
        ]))->assertStatus(422);
    }

    public function test_public_registration_creates_pending_record_without_osca_id(): void
    {
        $payload = $this->validRegistration();

        $response = $this->postJson('/api/register', $payload);
        $response->assertCreated();

        $this->assertDatabaseHas('seniors', [
            'first_name' => 'Reg',
            'last_name' => $payload['lastName'],
            'status' => 'Pending',
            'osca_id' => null,
        ]);
    }

    public function test_public_registration_rejects_duplicate_name_and_birthdate(): void
    {
        $payload = $this->validRegistration();
        $this->postJson('/api/register', $payload)->assertCreated();
        $this->postJson('/api/register', $payload)->assertStatus(409);
    }

    public function test_login_is_throttled_after_five_attempts(): void
    {
        User::create([
            'name' => 'Throttle', 'email' => 'throttle@osca.ph',
            'password' => Hash::make('ThrottlePass123!'), 'role' => 'Admin',
            'status' => 'Active', 'force_password_change' => false,
        ]);

        for ($i = 0; $i < 5; $i++) {
            $this->postJson('/api/login', [
                'identifier' => 'throttle@osca.ph',
                'password' => 'wrong-password',
            ])->assertStatus(422);
        }

        $this->postJson('/api/login', [
            'identifier' => 'throttle@osca.ph',
            'password' => 'wrong-password',
        ])->assertStatus(429);
    }

    public function test_reports_require_staff_role(): void
    {
        // Anonymous: rejected.
        $this->getJson('/api/reports/senior-citizens')->assertUnauthorized();

        // Senior self-service accounts: forbidden.
        $senior = Senior::create([
            'osca_id' => 'R-' . uniqid(), 'first_name' => 'Rep', 'last_name' => 'Senior',
            'date_of_birth' => '1950-01-01', 'age' => 76, 'sex' => 'Male',
            'pension_status' => 'Indigent', 'barangay' => 'Test Barangay',
            'street_address' => '1 Test St', 'status' => 'Active',
            'password' => Hash::make('SeniorPass123!'), 'force_password_change' => false,
        ]);
        $this->freshRequest($senior->createToken('t')->plainTextToken)
            ->get('/api/reports/senior-citizens')
            ->assertForbidden();

        // Staff: report downloads.
        $staff = User::create([
            'name' => 'Reporter', 'email' => 'reporter-' . uniqid() . '@osca.ph',
            'password' => Hash::make('ReporterPass123!'), 'role' => 'Staff',
            'status' => 'Active', 'force_password_change' => false,
        ]);
        $response = $this->freshRequest($staff->createToken('t')->plainTextToken)
            ->get('/api/reports/senior-citizens');
        $response->assertOk();
        $this->assertStringContainsString(
            'spreadsheetml.sheet',
            $response->headers->get('Content-Type') ?? ''
        );
    }
}
