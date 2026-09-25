<?php

namespace Tests\Feature;

use App\Models\ActivityLog;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ActivityLogFlowTest extends TestCase
{
    use RefreshDatabase;

    private function makeUser(string $role): User
    {
        return User::create([
            'name' => "Log {$role}",
            'email' => 'log-' . strtolower($role) . '-' . uniqid() . '@example.com',
            'password' => 'password123',
            'role' => $role,
        ]);
    }

    private function headers(User $user): array
    {
        return ['Authorization' => 'Bearer ' . $user->createToken('t')->plainTextToken];
    }

    public function test_store_persists_log_with_ip(): void
    {
        $staff = $this->makeUser('Staff');

        $response = $this->postJson('/api/activity-logs', [
            'action' => 'VIEWED_REPORT',
            'target_type' => 'Report',
            'target_id' => 7,
        ], $this->headers($staff));

        $response->assertCreated();
        $this->assertDatabaseHas('activity_logs', [
            'action' => 'VIEWED_REPORT',
            'target_type' => 'Report',
            'target_id' => 7,
            'user_id' => $staff->id,
        ]);
        $log = ActivityLog::where('action', 'VIEWED_REPORT')->first();
        $this->assertNotNull($log->ip_address);
    }

    public function test_store_requires_action(): void
    {
        $staff = $this->makeUser('Staff');

        $this->postJson('/api/activity-logs', [], $this->headers($staff))->assertStatus(422);
    }

    public function test_clear_requires_admin_and_staff_is_forbidden(): void
    {
        $staff = $this->makeUser('Staff');

        $this->deleteJson('/api/activity-logs', [], $this->headers($staff))->assertForbidden();
    }

    public function test_admin_can_clear_logs(): void
    {
        $admin = $this->makeUser('Admin');
        ActivityLog::create([
            'user_id' => $admin->id,
            'action' => 'LOGIN',
            'target_type' => 'User',
            'target_id' => $admin->id,
            'ip_address' => '127.0.0.1',
        ]);

        $response = $this->deleteJson('/api/activity-logs', [], $this->headers($admin));

        $response->assertOk();
        $response->assertJsonPath('success', true);
        // Only the CLEARED_LOGS entry itself remains
        $this->assertSame(1, ActivityLog::count());
        $this->assertSame('CLEARED_LOGS', ActivityLog::first()->action);
    }
}
