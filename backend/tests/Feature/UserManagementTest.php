<?php

namespace Tests\Feature;

use App\Models\Senior;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UserManagementTest extends TestCase
{
    use RefreshDatabase;

    private function makeUser(string $role, ?string $email = null): User
    {
        return User::create([
            'name' => "Test {$role}",
            'email' => $email ?? strtolower($role) . '-' . uniqid() . '@example.com',
            'password' => 'password123',
            'role' => $role,
        ]);
    }

    private function makeSenior(): Senior
    {
        return Senior::create([
            'osca_id' => 'OSCA-' . uniqid(),
            'first_name' => 'Senior',
            'last_name' => 'User',
            'date_of_birth' => '1960-01-01',
            'age' => 66,
            'sex' => 'Male',
            'barangay' => 'Poblacion I (Barangay I)',
            'street_address' => '123 Test St',
            'status' => 'Active',
            'password' => 'password123',
        ]);
    }

    private function headers($model): array
    {
        return ['Authorization' => 'Bearer ' . $model->createToken('t')->plainTextToken];
    }

    public function test_staff_cannot_list_users(): void
    {
        $this->getJson('/api/users', $this->headers($this->makeUser('Staff')))->assertForbidden();
    }

    public function test_senior_cannot_list_users(): void
    {
        $this->getJson('/api/users', $this->headers($this->makeSenior()))->assertForbidden();
    }

    public function test_guest_cannot_list_users(): void
    {
        $this->getJson('/api/users')->assertUnauthorized();
    }

    public function test_staff_cannot_create_user(): void
    {
        $this->postJson('/api/users', [
            'name' => 'New Staff',
            'email' => 'new-' . uniqid() . '@example.com',
            'password' => 'password123',
            'role' => 'Staff',
        ], $this->headers($this->makeUser('Staff')))->assertForbidden();
    }

    public function test_staff_cannot_update_or_delete_user(): void
    {
        $staff = $this->makeUser('Staff');
        $target = $this->makeUser('Staff');
        $headers = $this->headers($staff);

        $this->putJson("/api/users/{$target->id}", ['name' => 'Hacked'], $headers)->assertForbidden();
        $this->deleteJson("/api/users/{$target->id}", [], $headers)->assertForbidden();
    }

    public function test_admin_can_create_and_list_users(): void
    {
        $admin = $this->makeUser('Admin');
        $headers = $this->headers($admin);
        $email = 'created-' . uniqid() . '@example.com';

        $this->postJson('/api/users', [
            'name' => 'Created Staff',
            'email' => $email,
            'password' => 'password123',
            'role' => 'Staff',
        ], $headers)->assertCreated()->assertJsonPath('success', true);

        $this->assertDatabaseHas('users', ['email' => $email, 'role' => 'Staff']);

        $this->getJson('/api/users', $headers)->assertOk();
    }

    public function test_admin_cannot_delete_own_account(): void
    {
        $admin = $this->makeUser('Admin');

        $this->deleteJson("/api/users/{$admin->id}", [], $this->headers($admin))->assertStatus(400);
        $this->assertDatabaseHas('users', ['id' => $admin->id]);
    }
}
