<?php

namespace Tests\Feature;

use App\Models\Senior;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthFlowTest extends TestCase
{
    use RefreshDatabase;

    private function makeStaff(array $overrides = []): User
    {
        return User::create(array_merge([
            'name' => 'Auth Staff',
            'email' => 'auth-' . uniqid() . '@example.com',
            'password' => 'password123',
            'role' => 'Staff',
        ], $overrides));
    }

    private function makeSenior(array $overrides = []): Senior
    {
        return Senior::create(array_merge([
            'osca_id' => 'OSCA-' . uniqid(),
            'first_name' => 'Auth',
            'last_name' => 'Senior',
            'date_of_birth' => '1960-01-01',
            'age' => 66,
            'sex' => 'Male',
            'barangay' => 'Poblacion I (Barangay I)',
            'street_address' => '123 Test St',
            'status' => 'Active',
            'password' => 'seniorpass',
        ], $overrides));
    }

    private function headers(string $token): array
    {
        return ['Authorization' => 'Bearer ' . $token];
    }

    public function test_staff_can_login_with_email(): void
    {
        $staff = $this->makeStaff();

        $response = $this->postJson('/api/login', [
            'email' => $staff->email,
            'password' => 'password123',
        ]);

        $response->assertOk();
        $response->assertJsonPath('success', true);
        $response->assertJsonPath('user.email', $staff->email);
        $response->assertJsonPath('user.role', 'Staff');
        $response->assertJsonStructure(['token']);
        $this->assertDatabaseHas('activity_logs', ['action' => 'LOGIN', 'target_type' => 'User']);
    }

    public function test_staff_login_with_wrong_password_is_rejected(): void
    {
        $staff = $this->makeStaff();

        $response = $this->postJson('/api/login', [
            'email' => $staff->email,
            'password' => 'wrong-password',
        ]);

        $response->assertStatus(422);
    }

    public function test_login_without_identifier_is_rejected(): void
    {
        $response = $this->postJson('/api/login', ['password' => 'password123']);

        $response->assertStatus(422);
    }

    public function test_senior_can_login_with_osca_id(): void
    {
        $senior = $this->makeSenior();

        $response = $this->postJson('/api/login', [
            'osca_id' => $senior->osca_id,
            'password' => 'seniorpass',
        ]);

        $response->assertOk();
        $response->assertJsonPath('success', true);
        $response->assertJsonPath('user.role', 'Senior');
        $response->assertJsonStructure(['token']);
    }

    public function test_me_returns_staff_profile(): void
    {
        $staff = $this->makeStaff();

        $response = $this->getJson('/api/me', $this->headers($staff->createToken('t')->plainTextToken));

        $response->assertOk();
        $response->assertJsonPath('email', $staff->email);
        $response->assertJsonPath('role', 'Staff');
    }

    public function test_me_returns_senior_profile(): void
    {
        $senior = $this->makeSenior();

        $response = $this->getJson('/api/me', $this->headers($senior->createToken('t')->plainTextToken));

        $response->assertOk();
        $response->assertJsonPath('role', 'Senior');
        $response->assertJsonPath('id', $senior->osca_id);
    }

    public function test_logout_revokes_current_token(): void
    {
        $staff = $this->makeStaff();
        $token = $staff->createToken('t')->plainTextToken;

        $this->postJson('/api/logout', [], $this->headers($token))
            ->assertOk()
            ->assertJsonPath('success', true);

        // The current token row is revoked. A follow-up 401 cannot be
        // asserted in-process because Sanctum's web-guard session persists
        // across test requests sharing one app instance.
        $this->assertSame(0, $staff->tokens()->count());
        $this->assertDatabaseHas('activity_logs', ['action' => 'LOGOUT']);
    }

    public function test_change_password_validates_input(): void
    {
        $staff = $this->makeStaff();
        $headers = $this->headers($staff->createToken('t')->plainTextToken);

        // Too short + no confirmation
        $this->postJson('/api/change-password', [
            'current_password' => 'password123',
            'new_password' => 'short',
        ], $headers)->assertStatus(422);

        // Wrong current password
        $this->postJson('/api/change-password', [
            'current_password' => 'not-the-password',
            'new_password' => 'newpassword123',
            'new_password_confirmation' => 'newpassword123',
        ], $headers)->assertStatus(422);
    }

    public function test_change_password_success_allows_login_with_new_password(): void
    {
        $staff = $this->makeStaff();
        $headers = $this->headers($staff->createToken('t')->plainTextToken);

        $this->postJson('/api/change-password', [
            'current_password' => 'password123',
            'new_password' => 'brandnewpass1',
            'new_password_confirmation' => 'brandnewpass1',
        ], $headers)
            ->assertOk()
            ->assertJsonPath('success', true);

        $this->postJson('/api/login', [
            'email' => $staff->email,
            'password' => 'brandnewpass1',
        ])->assertOk();
    }
}
