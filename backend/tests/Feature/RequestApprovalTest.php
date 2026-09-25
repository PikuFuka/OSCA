<?php

namespace Tests\Feature;

use App\Models\Request as SeniorRequest;
use App\Models\Senior;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RequestApprovalTest extends TestCase
{
    use RefreshDatabase;

    private function makeStaff(): User
    {
        return User::create([
            'name' => 'Approval Staff',
            'email' => 'approve-' . uniqid() . '@example.com',
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

    public function test_approve_new_application_activates_senior_sets_osca_id_and_logs(): void
    {
        $staff = $this->makeStaff();
        $pending = $this->makeSenior(['osca_id' => null, 'status' => 'Pending', 'first_name' => 'Pending', 'last_name' => 'Applicant']);
        $req = SeniorRequest::create([
            'senior_id' => $pending->id,
            'type' => 'New Application',
            'status' => 'Pending',
        ]);
        $oscaId = 'OSCA-NEW-' . uniqid();

        $response = $this->putJson("/api/requests/{$req->id}/approve", ['osca_id' => $oscaId], $this->headers($staff));

        $response->assertOk();
        $response->assertJsonPath('success', true);
        $this->assertSame('Approved', $req->fresh()->status);
        $this->assertSame('Active', $pending->fresh()->status);
        $this->assertSame($oscaId, $pending->fresh()->osca_id);
        $this->assertDatabaseHas('activity_logs', [
            'action' => 'APPROVED_REQUEST',
            'target_type' => 'Request',
            'target_id' => $req->id,
        ]);
    }

    public function test_approve_information_update_applies_pending_data(): void
    {
        $staff = $this->makeStaff();
        $senior = $this->makeSenior();
        $req = SeniorRequest::create([
            'senior_id' => $senior->id,
            'type' => 'Information Update',
            'status' => 'Pending',
            'pending_data' => [
                'firstName' => 'Updated',
                'barangay' => 'Anibong',
                'streetAddress' => '999 New Street',
            ],
        ]);

        $response = $this->putJson("/api/requests/{$req->id}/approve", [], $this->headers($staff));

        $response->assertOk();
        $this->assertSame('Approved', $req->fresh()->status);
        $fresh = $senior->fresh();
        $this->assertSame('Updated', $fresh->first_name);
        $this->assertSame('Anibong', $fresh->barangay);
        $this->assertSame('999 New Street', $fresh->street_address);
        $this->assertSame('Active', $fresh->status);
    }

    public function test_reject_sets_status_and_reason_and_keeps_senior(): void
    {
        $staff = $this->makeStaff();
        $senior = $this->makeSenior();
        $req = SeniorRequest::create([
            'senior_id' => $senior->id,
            'type' => 'Information Update',
            'status' => 'Pending',
            'pending_data' => ['firstName' => 'ShouldNotApply'],
        ]);

        $response = $this->putJson("/api/requests/{$req->id}/reject", ['reason' => 'Incomplete details'], $this->headers($staff));

        $response->assertOk();
        $fresh = $req->fresh();
        $this->assertSame('Rejected', $fresh->status);
        $this->assertSame('Incomplete details', $fresh->rejection_reason);
        // Senior keeps original data and still exists
        $this->assertSame('Juan', $senior->fresh()->first_name);
        $this->assertDatabaseHas('seniors', ['id' => $senior->id]);
        $this->assertDatabaseHas('activity_logs', [
            'action' => 'REJECTED_REQUEST',
            'target_type' => 'Request',
            'target_id' => $req->id,
        ]);
    }

    public function test_reject_new_application_removes_pending_senior(): void
    {
        $staff = $this->makeStaff();
        $pending = $this->makeSenior(['osca_id' => null, 'status' => 'Pending']);
        $req = SeniorRequest::create([
            'senior_id' => $pending->id,
            'type' => 'New Application',
            'status' => 'Pending',
        ]);

        $this->putJson("/api/requests/{$req->id}/reject", ['reason' => 'Duplicate'], $this->headers($staff))->assertOk();

        // Senior is force-deleted; requests.senior_id cascades, so the
        // request row itself is removed as well.
        $this->assertDatabaseMissing('seniors', ['id' => $pending->id]);
        $this->assertDatabaseMissing('requests', ['id' => $req->id]);
        $this->assertDatabaseHas('activity_logs', [
            'action' => 'REJECTED_REQUEST',
            'target_type' => 'Request',
            'target_id' => $req->id,
        ]);
    }
}
