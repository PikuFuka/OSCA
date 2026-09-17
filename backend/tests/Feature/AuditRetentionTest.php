<?php

namespace Tests\Feature;

use App\Models\ActivityLog;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AuditRetentionTest extends TestCase
{
    use RefreshDatabase;

    public function test_scheduled_prune_keeps_logs_inside_retention_and_removes_older(): void
    {
        config(['audit.retention_days' => 30]);

        $admin = User::create([
            'name' => 'Audit Admin', 'email' => 'audit-' . uniqid() . '@osca.gov.ph',
            'password' => Hash::make('AuditPass123!'), 'role' => 'Admin',
            'status' => 'Active', 'force_password_change' => false,
        ]);
        $token = $admin->createToken('t')->plainTextToken;

        // created_at is not fillable: backdate via the query builder.
        $recent = ActivityLog::create([
            'user_id' => $admin->id, 'action' => 'RECENT_PROBE',
            'target_type' => 'System', 'target_id' => null,
        ]);
        $old = ActivityLog::create([
            'user_id' => $admin->id, 'action' => 'OLD_PROBE',
            'target_type' => 'System', 'target_id' => null,
        ]);
        ActivityLog::where('id', $recent->id)->update([
            'created_at' => now()->subDays(10), 'updated_at' => now()->subDays(10),
        ]);
        ActivityLog::where('id', $old->id)->update([
            'created_at' => now()->subDays(60), 'updated_at' => now()->subDays(60),
        ]);

        $this->assertSame(1, \App\Support\AuditRetention::prune());

        $this->assertDatabaseHas('activity_logs', ['action' => 'RECENT_PROBE']);
        $this->assertDatabaseMissing('activity_logs', ['action' => 'OLD_PROBE']);
    }

    public function test_log_viewer_is_a_pure_read_and_never_prunes(): void
    {
        config(['audit.retention_days' => 30]);

        $admin = User::create([
            'name' => 'Audit Admin', 'email' => 'audit-' . uniqid() . '@osca.gov.ph',
            'password' => Hash::make('AuditPass123!'), 'role' => 'Admin',
            'status' => 'Active', 'force_password_change' => false,
        ]);
        $token = $admin->createToken('t')->plainTextToken;

        $old = ActivityLog::create([
            'user_id' => $admin->id, 'action' => 'OLD_PROBE',
            'target_type' => 'System', 'target_id' => null,
        ]);
        ActivityLog::where('id', $old->id)->update([
            'created_at' => now()->subDays(60), 'updated_at' => now()->subDays(60),
        ]);

        $this->withHeader('Authorization', 'Bearer ' . $token)
            ->getJson('/api/activity-logs')
            ->assertOk();

        // Pruning is the scheduled job's responsibility now.
        $this->assertDatabaseHas('activity_logs', ['action' => 'OLD_PROBE']);
    }

    public function test_zero_retention_disables_scheduled_pruning(): void
    {
        config(['audit.retention_days' => 0]);

        $admin = User::create([
            'name' => 'Audit Admin', 'email' => 'audit-' . uniqid() . '@osca.gov.ph',
            'password' => Hash::make('AuditPass123!'), 'role' => 'Admin',
            'status' => 'Active', 'force_password_change' => false,
        ]);
        $token = $admin->createToken('t')->plainTextToken;

        $ancient = ActivityLog::create([
            'user_id' => $admin->id, 'action' => 'ANCIENT_PROBE',
            'target_type' => 'System', 'target_id' => null,
        ]);
        ActivityLog::where('id', $ancient->id)->update([
            'created_at' => now()->subDays(400), 'updated_at' => now()->subDays(400),
        ]);

        $this->assertSame(0, \App\Support\AuditRetention::prune());

        $this->assertDatabaseHas('activity_logs', ['action' => 'ANCIENT_PROBE']);
    }
}
