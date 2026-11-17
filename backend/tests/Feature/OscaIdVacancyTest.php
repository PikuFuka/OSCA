<?php

namespace Tests\Feature;

use App\Models\Request as SeniorRequest;
use App\Models\Senior;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class OscaIdVacancyTest extends TestCase
{
    use RefreshDatabase;

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

    private function makeStaff(): User
    {
        return User::create([
            'name' => 'Operations Staff',
            'email' => 'operations-' . uniqid() . '@example.com',
            'password' => 'password123',
            'role' => 'Staff',
        ]);
    }

    private function makeSenior(array $overrides = []): Senior
    {
        return Senior::create(array_merge([
            'osca_id' => 'VAC-' . uniqid(),
            'first_name' => 'Vacancy',
            'middle_name' => 'Test',
            'last_name' => 'Holder',
            'date_of_birth' => '1960-01-01',
            'age' => 66,
            'sex' => 'Female',
            'barangay' => 'Anibong',
            'street_address' => '123 Test St',
            'status' => 'Active',
        ], $overrides));
    }

    public function test_marking_a_senior_deceased_vacates_the_osca_id(): void
    {
        $senior = $this->makeSenior([
            'first_name' => 'Deceased',
            'middle_name' => null,
            'last_name' => 'Holder',
            'osca_id' => 'VAC-DECEASED',
        ]);
        Sanctum::actingAs($this->makeStaff());

        $response = $this->postJson("/api/seniors/{$senior->id}/deceased");

        $response->assertOk();
        $senior->refresh();
        $this->assertSame('Deceased', $senior->status);
        $this->assertNull($senior->osca_id);
        $this->assertSame('VAC-DECEASED', $senior->former_osca_id);

        $this->assertDatabaseHas('osca_id_vacancies', [
            'osca_id' => 'VAC-DECEASED',
            'senior_id' => $senior->id,
            'past_holder_name' => 'Deceased Holder',
            'reason' => 'Deceased',
        ]);

        $vacancy = \App\Models\OscaIdVacancy::where('osca_id', 'VAC-DECEASED')->firstOrFail();
        $this->assertSame('2026-11-14', $vacancy->vacated_at->format('Y-m-d'));
    }

    public function test_deleting_a_senior_vacates_the_osca_id(): void
    {
        $senior = $this->makeSenior([
            'first_name' => 'Deleted',
            'middle_name' => null,
            'last_name' => 'Holder',
            'osca_id' => 'VAC-DELETED',
        ]);
        Sanctum::actingAs($this->makeStaff());

        $response = $this->deleteJson("/api/seniors/{$senior->id}");

        $response->assertOk();
        $this->assertSoftDeleted('seniors', ['id' => $senior->id]);

        $senior->refresh();
        $this->assertNull($senior->osca_id);
        $this->assertSame('VAC-DELETED', $senior->former_osca_id);

        $this->assertDatabaseHas('osca_id_vacancies', [
            'osca_id' => 'VAC-DELETED',
            'senior_id' => $senior->id,
            'past_holder_name' => 'Deleted Holder',
            'reason' => 'Deleted',
        ]);
    }

    public function test_restoring_a_deleted_senior_reclaims_their_still_available_id(): void
    {
        $senior = $this->makeSenior(['osca_id' => 'VAC-RESTORE']);
        Sanctum::actingAs($this->makeStaff());

        $this->deleteJson("/api/seniors/{$senior->id}")->assertOk();
        $this->postJson("/api/seniors/{$senior->id}/restore")->assertOk();

        $senior->refresh();
        $this->assertSame('VAC-RESTORE', $senior->osca_id);
        $this->assertNull($senior->former_osca_id);
        $this->assertDatabaseMissing('osca_id_vacancies', ['osca_id' => 'VAC-RESTORE']);
    }

    public function test_reverting_a_deceased_senior_reclaims_their_still_available_id(): void
    {
        $senior = $this->makeSenior(['osca_id' => 'VAC-REVERT']);
        Sanctum::actingAs($this->makeStaff());

        $this->postJson("/api/seniors/{$senior->id}/deceased")->assertOk();
        $this->postJson("/api/seniors/{$senior->id}/un-deceased")->assertOk();

        $senior->refresh();
        $this->assertSame('Active', $senior->status);
        $this->assertSame('VAC-REVERT', $senior->osca_id);
        $this->assertNull($senior->former_osca_id);
        $this->assertDatabaseMissing('osca_id_vacancies', ['osca_id' => 'VAC-REVERT']);
    }

    public function test_restoring_when_the_id_was_reassigned_restores_without_an_id_and_pending_status(): void
    {
        $senior = $this->makeSenior(['osca_id' => 'VAC-GONE']);
        Sanctum::actingAs($this->makeStaff());

        $this->deleteJson("/api/seniors/{$senior->id}")->assertOk();

        // A new member claims the released ID before the original is restored.
        $claimant = $this->makeSenior(['osca_id' => 'VAC-CLAIMANT', 'status' => 'Pending']);
        $claimant->update(['osca_id' => 'VAC-GONE']);
        \App\Models\OscaIdVacancy::where('osca_id', 'VAC-GONE')->delete();

        $this->postJson("/api/seniors/{$senior->id}/restore")->assertOk();

        $senior->refresh();
        $this->assertNull($senior->osca_id);
        $this->assertSame('Pending', $senior->status);
        $this->assertSame('VAC-GONE', $senior->former_osca_id);
    }

    public function test_approving_a_member_with_a_vacant_id_claims_it(): void
    {
        $deceased = $this->makeSenior([
            'osca_id' => 'VAC-APPROVE',
            'first_name' => 'Past',
            'middle_name' => null,
            'last_name' => 'Holder',
        ]);
        Sanctum::actingAs($this->makeStaff());

        // Release the ID through the real flow first.
        $this->postJson("/api/seniors/{$deceased->id}/deceased")->assertOk();

        $applicant = $this->makeSenior([
            'osca_id' => null,
            'first_name' => 'New',
            'last_name' => 'Applicant',
            'status' => 'Pending',
        ]);
        $request = SeniorRequest::create([
            'senior_id' => $applicant->id,
            'type' => 'New Application',
            'status' => 'Pending',
        ]);

        $this->putJson("/api/requests/{$request->id}/approve", [
            'osca_id' => 'VAC-APPROVE',
        ])->assertOk();

        $applicant->refresh();
        $this->assertSame('VAC-APPROVE', $applicant->osca_id);
        $this->assertSame('Active', $applicant->status);
        $this->assertDatabaseMissing('osca_id_vacancies', ['osca_id' => 'VAC-APPROVE']);
    }

    public function test_available_ids_endpoint_lists_vacancies_with_the_required_columns(): void
    {
        $senior = $this->makeSenior(['osca_id' => 'VAC-LIST']);
        \App\Models\OscaIdVacancy::create([
            'osca_id' => 'VAC-LIST',
            'senior_id' => $senior->id,
            'past_holder_name' => 'Listed Holder',
            'reason' => 'Deleted',
            'vacated_at' => Carbon::create(2026, 10, 5, 9, 30, 0),
        ]);
        Sanctum::actingAs($this->makeStaff());

        $response = $this->getJson('/api/osca-id-vacancies');

        $response->assertOk()
            ->assertJsonPath('data.0.oscaId', 'VAC-LIST')
            ->assertJsonPath('data.0.reason', 'Deleted')
            ->assertJsonPath('data.0.pastHolder', 'Listed Holder')
            ->assertJsonPath('data.0.vacatedAt', '2026-10-05');
    }

    public function test_available_ids_endpoint_is_limited_to_staff_and_admin(): void
    {
        Sanctum::actingAs($this->makeSenior(['osca_id' => 'VAC-SENIOR']));

        $this->getJson('/api/osca-id-vacancies')->assertForbidden();
    }
}
