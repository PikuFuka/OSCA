<?php

namespace Tests\Feature;

use App\Models\ActivityLog;
use App\Models\Request as SeniorRequest;
use App\Models\Senior;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SeniorHistoryTest extends TestCase
{
    use RefreshDatabase;

    private function makeStaff(): User
    {
        return User::create([
            'name' => 'History Staff',
            'email' => 'history-' . uniqid() . '@example.com',
            'password' => 'password123',
            'role' => 'Staff',
        ]);
    }

    private function makeSenior(array $overrides = []): Senior
    {
        return Senior::create(array_merge([
            'osca_id' => 'OSCA-' . uniqid(),
            'first_name' => 'Juan',
            'last_name' => 'Dela Cruz',
            'date_of_birth' => '1960-01-01',
            'age' => 66,
            'sex' => 'Male',
            'barangay' => 'Poblacion I (Barangay I)',
            'street_address' => '123 Test St',
            'status' => 'Active',
            'password' => 'password123',
        ], $overrides));
    }

    private function headers(User $staff): array
    {
        return ['Authorization' => 'Bearer ' . $staff->createToken('t')->plainTextToken];
    }

    public function test_history_lists_only_this_seniors_events(): void
    {
        $staff = $this->makeStaff();
        $senior = $this->makeSenior();
        $other = $this->makeSenior(['first_name' => 'Other', 'last_name' => 'Member']);

        $request = SeniorRequest::create([
            'senior_id' => $senior->id,
            'type' => 'Information Update',
            'status' => 'Pending',
        ]);
        $otherRequest = SeniorRequest::create([
            'senior_id' => $other->id,
            'type' => 'Information Update',
            'status' => 'Pending',
        ]);

        ActivityLog::create([
            'user_id' => $staff->id,
            'action' => 'UPDATED_SENIOR',
            'target_type' => 'Senior',
            'target_id' => $senior->id,
            'details' => ['name' => $senior->full_name, 'changed_fields' => ['first_name']],
        ]);
        ActivityLog::create([
            'user_id' => $staff->id,
            'action' => 'REQUESTED_NEW_ID',
            'target_type' => 'Senior',
            'target_id' => $senior->id,
            'details' => ['reason' => 'Lost ID', 'notes' => 'Lost wallet'],
        ]);
        ActivityLog::create([
            'user_id' => $staff->id,
            'action' => 'APPROVED_REQUEST',
            'target_type' => 'Request',
            'target_id' => $request->id,
            'details' => ['type' => 'Information Update'],
        ]);
        ActivityLog::create([
            'user_id' => $staff->id,
            'action' => 'UPDATED_SENIOR',
            'target_type' => 'Senior',
            'target_id' => $other->id,
            'details' => ['name' => $other->full_name],
        ]);
        ActivityLog::create([
            'user_id' => $staff->id,
            'action' => 'APPROVED_REQUEST',
            'target_type' => 'Request',
            'target_id' => $otherRequest->id,
            'details' => ['type' => 'Information Update'],
        ]);

        $response = $this->getJson("/api/seniors/{$senior->osca_id}/history", $this->headers($staff));

        $response->assertOk();
        $response->assertJsonCount(3, 'data');
        $response->assertJsonFragment(['action' => 'UPDATED_SENIOR']);
        $response->assertJsonFragment(['action' => 'REQUESTED_NEW_ID']);
        $response->assertJsonFragment(['action' => 'APPROVED_REQUEST']);
        $response->assertJsonFragment(['reason' => 'Lost ID']);
    }

    public function test_history_excludes_login_and_logout_activity(): void
    {
        $staff = $this->makeStaff();
        $senior = $this->makeSenior();

        ActivityLog::create([
            'user_id' => null,
            'action' => 'LOGIN',
            'target_type' => 'Senior',
            'target_id' => $senior->id,
            'details' => ['osca_id' => $senior->osca_id],
        ]);
        ActivityLog::create([
            'user_id' => null,
            'action' => 'LOGOUT',
            'target_type' => 'Senior',
            'target_id' => $senior->id,
        ]);
        ActivityLog::create([
            'user_id' => $staff->id,
            'action' => 'UPDATED_SENIOR',
            'target_type' => 'Senior',
            'target_id' => $senior->id,
            'details' => ['name' => $senior->full_name, 'changed_fields' => ['contact_number']],
        ]);

        $response = $this->getJson("/api/seniors/{$senior->osca_id}/history", $this->headers($staff));

        $response->assertOk();
        $response->assertJsonCount(1, 'data');
        $response->assertJsonPath('data.0.action', 'UPDATED_SENIOR');
        $response->assertJsonMissing(['action' => 'LOGIN']);
        $response->assertJsonMissing(['action' => 'LOGOUT']);
    }

    public function test_staff_can_record_an_id_replacement_request_with_reason(): void
    {
        $staff = $this->makeStaff();
        $senior = $this->makeSenior();

        $response = $this->postJson("/api/seniors/{$senior->osca_id}/id-request", [
            'reason' => 'Damaged ID',
            'notes' => 'Card is cracked.',
        ], $this->headers($staff));

        $response->assertCreated();
        $response->assertJsonPath('success', true);

        $this->assertDatabaseHas('requests', [
            'senior_id' => $senior->id,
            'type' => 'ID Replacement',
            'status' => 'Pending',
            'reason' => 'Damaged ID',
        ]);

        $log = ActivityLog::where('action', 'REQUESTED_NEW_ID')->first();
        $this->assertNotNull($log);
        $this->assertSame($senior->id, $log->target_id);
        $this->assertSame('Damaged ID', $log->details['reason']);
        $this->assertSame('Card is cracked.', $log->details['notes']);
    }

    public function test_id_replacement_request_requires_a_valid_reason(): void
    {
        $staff = $this->makeStaff();
        $senior = $this->makeSenior();

        $response = $this->postJson("/api/seniors/{$senior->osca_id}/id-request", [
            'reason' => 'Stolen',
        ], $this->headers($staff));

        $response->assertStatus(422);
        $this->assertDatabaseCount('requests', 0);
    }

    public function test_duplicate_pending_id_replacement_request_is_rejected(): void
    {
        $staff = $this->makeStaff();
        $senior = $this->makeSenior();

        SeniorRequest::create([
            'senior_id' => $senior->id,
            'type' => 'ID Replacement',
            'status' => 'Pending',
            'reason' => 'Lost ID',
        ]);

        $response = $this->postJson("/api/seniors/{$senior->osca_id}/id-request", [
            'reason' => 'Damaged ID',
        ], $this->headers($staff));

        $response->assertStatus(422);
        $response->assertJsonPath('success', false);
        $this->assertSame(1, SeniorRequest::where('senior_id', $senior->id)->where('type', 'ID Replacement')->count());
    }

    public function test_approving_an_id_replacement_does_not_change_senior_identity_or_status(): void
    {
        $staff = $this->makeStaff();
        $senior = $this->makeSenior(['osca_id' => 'OSCA-ORIGINAL', 'status' => 'Inactive']);
        $request = SeniorRequest::create([
            'senior_id' => $senior->id,
            'type' => 'ID Replacement',
            'status' => 'Pending',
            'reason' => 'Lost ID',
        ]);

        $response = $this->putJson("/api/requests/{$request->id}/approve", [
            'osca_id' => 'OSCA-SHOULD-NOT-APPLY',
        ], $this->headers($staff));

        $response->assertOk();
        $this->assertSame('Approved', $request->fresh()->status);

        $fresh = $senior->fresh();
        $this->assertSame('OSCA-ORIGINAL', $fresh->osca_id);
        $this->assertSame('Inactive', $fresh->status);
    }

    public function test_history_requires_authentication(): void
    {
        $senior = $this->makeSenior();

        $this->getJson("/api/seniors/{$senior->osca_id}/history")->assertUnauthorized();
    }
}
