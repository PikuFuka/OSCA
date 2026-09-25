<?php

namespace Tests\Feature;

use App\Exports\MasterlistSheet;
use App\Models\Senior;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use PhpOffice\PhpSpreadsheet\IOFactory;
use Tests\TestCase;

class ReportExportTest extends TestCase
{
    use RefreshDatabase;

    private function makeStaff(): User
    {
        return User::create([
            'name' => 'Report Staff',
            'email' => 'report-' . uniqid() . '@example.com',
            'password' => 'password123',
            'role' => 'Staff',
        ]);
    }

    private function makeSenior(string $barangay, array $overrides = []): Senior
    {
        return Senior::create(array_merge([
            'osca_id' => 'OSCA-' . uniqid(),
            'first_name' => 'Test',
            'last_name' => 'Senior',
            'date_of_birth' => '1960-01-01',
            'age' => 66,
            'sex' => 'Male',
            'barangay' => $barangay,
            'street_address' => '123 Test St',
            'status' => 'Active',
        ], $overrides));
    }

    public function test_masterlist_title_names_the_filtered_barangay(): void
    {
        $this->assertSame('Masterlist - Anibong', (new MasterlistSheet(null, 'Anibong'))->title());
        $this->assertSame('Masterlist of Pagsanjan', (new MasterlistSheet())->title());
    }

    public function test_filtered_export_contains_only_selected_barangay(): void
    {
        $this->makeSenior('Anibong');
        $this->makeSenior('Anibong');
        $this->makeSenior('Biñan');
        Sanctum::actingAs($this->makeStaff());

        $response = $this->get('/api/reports/senior-citizens?barangay=Anibong');

        $response->assertOk();
        $response->assertHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        $this->assertStringContainsStringIgnoringCase('anibong', $response->headers->get('Content-Disposition'));

        $reader = IOFactory::createReader('Xlsx');
        $reader->setReadDataOnly(true);
        $book = $reader->load($response->getFile()->getRealPath());

        $this->assertEqualsCanonicalizing(['Anibong', 'Masterlist - Anibong'], $book->getSheetNames());

        foreach ($book->getAllSheets() as $sheet) {
            $maxRow = $sheet->getHighestRow();
            for ($r = 1; $r <= $maxRow; $r++) {
                foreach (range('A', 'T') as $c) {
                    if (strtoupper(trim((string) $sheet->getCell($c . $r)->getValue())) === 'BARANGAY') {
                        for ($d = $r + 1; $d <= $maxRow; $d++) {
                            $value = trim((string) $sheet->getCell($c . $d)->getValue());
                            if ($value !== '') {
                                $this->assertSame('Anibong', $value);
                            }
                        }
                    }
                }
            }
        }
    }

    public function test_unfiltered_export_contains_all_barangays(): void
    {
        $this->makeSenior('Anibong');
        $this->makeSenior('Biñan');
        Sanctum::actingAs($this->makeStaff());

        $response = $this->get('/api/reports/senior-citizens');

        $response->assertOk();

        $reader = IOFactory::createReader('Xlsx');
        $reader->setReadDataOnly(true);
        $book = $reader->load($response->getFile()->getRealPath());

        $this->assertContains('Masterlist of Pagsanjan', $book->getSheetNames());
    }
}
