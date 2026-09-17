<?php

namespace Tests\Feature;

use App\Models\Senior;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class ReportExportTest extends TestCase
{
    use RefreshDatabase;

    public function test_single_barangay_report_downloads_as_xlsx(): void
    {
        $staff = User::create([
            'name' => 'Reporter', 'email' => 'reporter@osca.ph',
            'password' => Hash::make('ReporterPass123!'), 'role' => 'Staff',
            'status' => 'Active', 'force_password_change' => false,
        ]);
        $token = $staff->createToken('test')->plainTextToken;

        foreach (['Alpha', 'Beta'] as $last) {
            Senior::create([
                'first_name' => 'Rep', 'last_name' => $last,
                'date_of_birth' => '1950-06-15', 'age' => 76, 'sex' => 'Female',
                'barangay' => 'Test Barangay', 'street_address' => '1 Test St',
                'osca_id' => 'OSCA-2000-' . $last, 'status' => 'Active',
            ]);
        }

        $this->app['auth']->forgetGuards();
        $response = $this->getJson(
            '/api/reports/senior-citizens?barangay=Test Barangay',
            ['Authorization' => "Bearer {$token}"]
        );

        $response->assertOk();
        $this->assertStringContainsString(
            'spreadsheetml',
            $response->headers->get('Content-Type', '')
        );
        // Excel::download returns a BinaryFileResponse (file on disk, not
        // buffered content) — the disposition proves a workbook was built.
        $this->assertStringContainsString(
            '.xlsx',
            $response->headers->get('Content-Disposition', '')
        );
    }
}
