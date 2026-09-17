<?php

namespace Tests\Feature;

use App\Jobs\ReconcilePendingRequests;
use App\Models\Request as SeniorRequest;
use App\Models\Senior;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class RequestReconciliationTest extends TestCase
{
    use RefreshDatabase;

    private function makeSenior(array $overrides = []): Senior
    {
        return Senior::create(array_merge([
            'first_name' => 'Recon',
            'last_name' => 'Probe-' . uniqid(),
            'date_of_birth' => '1950-06-15',
            'age' => 76,
            'sex' => 'Female',
            'barangay' => 'Test Barangay',
            'street_address' => '1 Test St',
            'status' => 'Pending',
        ], $overrides));
    }

    private function staffToken(): string
    {
        $user = User::create([
            'name' => 'Recon', 'email' => 'recon@osca.ph',
            'password' => Hash::make('ReconPass123!'), 'role' => 'Staff',
            'status' => 'Active', 'force_password_change' => false,
        ]);

        return $user->createToken('test')->plainTextToken;
    }

    public function test_job_creates_missing_pending_requests(): void
    {
        $senior = $this->makeSenior();

        (new ReconcilePendingRequests)->handle();

        $this->assertDatabaseHas('requests', [
            'senior_id' => $senior->id,
            'status' => 'Pending',
        ]);
    }

    public function test_job_is_idempotent(): void
    {
        $senior = $this->makeSenior();

        (new ReconcilePendingRequests)->handle();
        (new ReconcilePendingRequests)->handle();

        $this->assertSame(1, SeniorRequest::where('senior_id', $senior->id)->count());
    }

    public function test_job_ignores_seniors_with_osca_id(): void
    {
        $senior = $this->makeSenior(['osca_id' => 'OSCA-2000-000001']);

        (new ReconcilePendingRequests)->handle();

        $this->assertSame(0, SeniorRequest::where('senior_id', $senior->id)->count());
    }

    public function test_requests_index_does_not_reconcile_synchronously(): void
    {
        $senior = $this->makeSenior();
        $token = $this->staffToken();

        $this->app['auth']->forgetGuards();
        $this->getJson('/api/requests', ['Authorization' => "Bearer {$token}"])->assertOk();

        // The list endpoint must be a pure read now; reconciliation is the
        // scheduled job's responsibility.
        $this->assertSame(0, SeniorRequest::where('senior_id', $senior->id)->count());
    }
}
