<?php

namespace Tests\Feature;

use App\Models\Senior;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\TestCase;

class SeniorRegistrationTest extends TestCase
{
    use RefreshDatabase;

    private function makeStaff(): User
    {
        return User::create([
            'name' => 'Reg Staff',
            'email' => 'reg-' . uniqid() . '@example.com',
            'password' => 'password123',
            'role' => 'Staff',
        ]);
    }

    private function registrationPayload(array $overrides = []): array
    {
        return array_merge([
            'firstName' => 'Reg',
            'lastName' => 'Ister',
            'dateOfBirth' => '1960-05-05',
            'age' => 66,
            'sex' => 'Male',
            'pensionStatus' => 'Indigent',
            'barangay' => 'Poblacion I (Barangay I)',
            'streetAddress' => '123 Test St',
        ], $overrides);
    }

    public function test_duplicate_registration_is_rejected_with_conflict(): void
    {
        Senior::create([
            'osca_id' => 'OSCA-EXIST-' . uniqid(),
            'first_name' => 'Reg',
            'last_name' => 'Ister',
            'date_of_birth' => '1960-05-05',
            'age' => 66,
            'sex' => 'Male',
            'barangay' => 'Poblacion I (Barangay I)',
            'street_address' => '123 Test St',
            'status' => 'Active',
        ]);

        // sqlite stores date_of_birth as 'Y-m-d H:i:s', so the service's
        // exact where() match needs the datetime form to hit on sqlite.
        // (On MySQL the plain Y-m-d matches the DATE column.)
        $response = $this->postJson('/api/register', $this->registrationPayload([
            'dateOfBirth' => '1960-05-05 00:00:00',
        ]));

        $response->assertStatus(409);
        $response->assertJsonPath('success', false);
    }

    public function test_registration_creates_pending_senior_and_request(): void
    {
        $response = $this->postJson('/api/register', $this->registrationPayload([
            'firstName' => 'Fresh',
            'lastName' => 'Applicant',
        ]));

        $response->assertCreated();
        $response->assertJsonPath('success', true);
        $this->assertDatabaseHas('seniors', [
            'first_name' => 'Fresh',
            'last_name' => 'Applicant',
            'status' => 'Pending',
        ]);
        $this->assertDatabaseHas('requests', [
            'type' => 'New Application',
            'status' => 'Pending',
        ]);
    }

    public function test_staff_update_persists_fields(): void
    {
        $staff = $this->makeStaff();
        $senior = Senior::create([
            'osca_id' => 'OSCA-UPD-' . uniqid(),
            'first_name' => 'Old',
            'last_name' => 'Name',
            'date_of_birth' => '1960-01-01',
            'age' => 66,
            'sex' => 'Male',
            'barangay' => 'Biñan',
            'street_address' => 'Old St',
            'status' => 'Active',
        ]);
        $headers = ['Authorization' => 'Bearer ' . $staff->createToken('t')->plainTextToken];

        $response = $this->putJson("/api/seniors/{$senior->osca_id}", [
            'firstName' => 'New',
            'barangay' => 'Anibong',
            'streetAddress' => 'New St',
        ], $headers);

        $response->assertOk();
        $response->assertJsonPath('success', true);
        $fresh = $senior->fresh();
        $this->assertSame('New', $fresh->first_name);
        $this->assertSame('Anibong', $fresh->barangay);
        $this->assertSame('New St', $fresh->street_address);
    }

    public function test_age_is_auto_calculated_from_date_of_birth(): void
    {
        $dob = '1950-03-15';
        $senior = Senior::create([
            'osca_id' => 'OSCA-AGE-' . uniqid(),
            'first_name' => 'Age',
            'last_name' => 'Check',
            'date_of_birth' => $dob,
            'age' => 60, // deliberately wrong; boot hook recalculates
            'sex' => 'Female',
            'barangay' => 'Biñan',
            'street_address' => '123 Test St',
            'status' => 'Active',
        ]);

        $this->assertSame(Carbon::parse($dob)->age, (int) $senior->fresh()->age);
    }

    public function test_empty_osca_id_is_normalized_to_null(): void
    {
        $senior = Senior::create([
            'osca_id' => '',
            'first_name' => 'Empty',
            'last_name' => 'Osca',
            'date_of_birth' => '1960-01-01',
            'age' => 66,
            'sex' => 'Male',
            'barangay' => 'Biñan',
            'street_address' => '123 Test St',
            'status' => 'Pending',
        ]);

        $this->assertNull($senior->fresh()->osca_id);
    }

    public function test_update_with_empty_osca_id_clears_it(): void
    {
        $staff = $this->makeStaff();
        $senior = Senior::create([
            'osca_id' => 'OSCA-CLR-' . uniqid(),
            'first_name' => 'Clear',
            'last_name' => 'Osca',
            'date_of_birth' => '1960-01-01',
            'age' => 66,
            'sex' => 'Male',
            'barangay' => 'Biñan',
            'street_address' => '123 Test St',
            'status' => 'Active',
        ]);
        $headers = ['Authorization' => 'Bearer ' . $staff->createToken('t')->plainTextToken];

        $this->putJson("/api/seniors/{$senior->osca_id}", ['oscaId' => ''], $headers)->assertOk();

        $this->assertNull($senior->fresh()->osca_id);
    }
}
