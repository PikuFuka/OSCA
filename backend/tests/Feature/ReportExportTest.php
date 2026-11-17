<?php

namespace Tests\Feature;

use App\Exports\DeceasedSheet;
use App\Exports\MasterlistSheet;
use App\Models\Senior;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
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
        $this->assertSame('Deceased - Anibong', (new DeceasedSheet(null, 'Anibong'))->title());
        $this->assertSame('Deceased of Pagsanjan', (new DeceasedSheet())->title());
    }

    private function sheetText(Worksheet $sheet): string
    {
        $text = '';
        foreach ($sheet->getRowIterator() as $row) {
            foreach ($row->getCellIterator() as $cell) {
                $text .= ' ' . (string) $cell->getValue();
            }
        }

        return $text;
    }

    public function test_filtered_export_contains_only_selected_barangay(): void
    {
        $this->makeSenior('Anibong');
        $this->makeSenior('Anibong');
        $this->makeSenior('Biñan');
        $this->makeSenior('Anibong', ['status' => 'Deceased']);
        $this->makeSenior('Biñan', ['status' => 'Deceased']);
        Sanctum::actingAs($this->makeStaff());

        $response = $this->get('/api/reports/senior-citizens?barangay=Anibong');

        $response->assertOk();
        $response->assertHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        $this->assertStringContainsStringIgnoringCase('anibong', $response->headers->get('Content-Disposition'));

        $reader = IOFactory::createReader('Xlsx');
        $reader->setReadDataOnly(true);
        $book = $reader->load($response->getFile()->getRealPath());

        $this->assertEqualsCanonicalizing(['Anibong', 'Masterlist - Anibong', 'Deceased - Anibong'], $book->getSheetNames());

        $anibongSheet = $book->getSheetByName('Anibong');
        $this->assertNotNull($anibongSheet);

        $barangayValues = array_merge(
            $this->sectionColumnValues($anibongSheet, 'VI. MASTERLIST OF LIVING SENIORS (PER BARANGAY)', 'H'),
            $this->sectionColumnValues($anibongSheet, 'VII. DECEASED SENIORS (PER BARANGAY)', 'H'),
            $this->consolidatedColumnValues($book->getSheetByName('Masterlist - Anibong'), 'H'),
            $this->consolidatedColumnValues($book->getSheetByName('Deceased - Anibong'), 'H'),
        );

        $this->assertNotEmpty($barangayValues);
        foreach ($barangayValues as $barangay) {
            $this->assertSame('Anibong', $barangay);
        }
    }

    public function test_masterlist_excludes_deceased_and_deceased_tab_contains_them(): void
    {
        $this->makeSenior('Anibong', [
            'first_name' => 'Living',
            'last_name' => 'ZZZALIVE',
            'status' => 'Active',
        ]);
        $this->makeSenior('Anibong', [
            'first_name' => 'Gone',
            'last_name' => 'ZZZDECEASED',
            'status' => 'Deceased',
        ]);
        Sanctum::actingAs($this->makeStaff());

        $response = $this->get('/api/reports/senior-citizens?barangay=Anibong');

        $response->assertOk();

        $reader = IOFactory::createReader('Xlsx');
        $reader->setReadDataOnly(true);
        $book = $reader->load($response->getFile()->getRealPath());

        $masterlist = $book->getSheetByName('Masterlist - Anibong');
        $deceased = $book->getSheetByName('Deceased - Anibong');

        $this->assertNotNull($masterlist);
        $this->assertNotNull($deceased);

        $masterlistText = $this->sheetText($masterlist);
        $deceasedText = $this->sheetText($deceased);

        $this->assertStringContainsString('ZZZALIVE', $masterlistText);
        $this->assertStringNotContainsString('ZZZDECEASED', $masterlistText);
        $this->assertStringContainsString('ZZZDECEASED', $deceasedText);
        $this->assertStringNotContainsString('ZZZALIVE', $deceasedText);
        $this->assertStringContainsString('TOTAL DECEASED SENIORS: 1', $deceasedText);
    }

    private function sectionColumnValues(Worksheet $sheet, string $title, string $column): array
    {
        $maxRow = $sheet->getHighestRow();
        $start = null;

        for ($r = 1; $r <= $maxRow; $r++) {
            if (trim((string) $sheet->getCell('A' . $r)->getValue()) === $title) {
                $start = $r + 2; // skip the section title and table header
                break;
            }
        }

        if ($start === null) {
            return [];
        }

        $values = [];
        for ($r = $start; $r <= $maxRow; $r++) {
            $value = trim((string) $sheet->getCell($column . $r)->getValue());
            if ($value === '') {
                break;
            }
            $values[] = $value;
        }

        return $values;
    }

    private function consolidatedColumnValues(?Worksheet $sheet, string $column): array
    {
        if ($sheet === null) {
            return [];
        }

        $values = [];
        $maxRow = $sheet->getHighestRow();

        // Consolidated masterlist/deceased sheets have their table header on
        // row 7 and data starting on row 8.
        for ($r = 8; $r <= $maxRow; $r++) {
            $lastName = trim((string) $sheet->getCell('C' . $r)->getValue());
            if ($lastName === '') {
                break;
            }
            $values[] = trim((string) $sheet->getCell($column . $r)->getValue());
        }

        return $values;
    }

    public function test_barangay_sheet_separates_living_and_deceased_tables(): void
    {
        $this->makeSenior('Anibong', [
            'first_name' => 'Living',
            'last_name' => 'ZZZALIVE',
            'status' => 'Active',
        ]);
        $this->makeSenior('Anibong', [
            'first_name' => 'Gone',
            'last_name' => 'ZZZDECEASED',
            'status' => 'Deceased',
        ]);
        Sanctum::actingAs($this->makeStaff());

        $response = $this->get('/api/reports/senior-citizens?barangay=Anibong');

        $response->assertOk();

        $reader = IOFactory::createReader('Xlsx');
        $reader->setReadDataOnly(true);
        $book = $reader->load($response->getFile()->getRealPath());

        $sheet = $book->getSheetByName('Anibong');
        $this->assertNotNull($sheet);

        $living = $this->sectionColumnValues(
            $sheet,
            'VI. MASTERLIST OF LIVING SENIORS (PER BARANGAY)',
            'B'
        );
        $deceased = $this->sectionColumnValues(
            $sheet,
            'VII. DECEASED SENIORS (PER BARANGAY)',
            'B'
        );

        $this->assertContains('Living ZZZALIVE', $living);
        $this->assertNotContains('Gone ZZZDECEASED', $living);
        $this->assertContains('Gone ZZZDECEASED', $deceased);
        $this->assertNotContains('Living ZZZALIVE', $deceased);
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
        $this->assertContains('Deceased of Pagsanjan', $book->getSheetNames());
    }

    public function test_age_filtered_export_contains_only_matching_seniors(): void
    {
        $today = \Illuminate\Support\Carbon::today();

        // 80 years old senior
        $dob80 = $today->copy()->subYears(80)->subMonths(2)->format('Y-m-d');
        $senior80 = $this->makeSenior('Anibong', [
            'first_name' => 'Octo',
            'last_name' => 'GENARIAN',
            'date_of_birth' => $dob80,
            'age' => 80,
            'status' => 'Active',
        ]);

        // 65 years old senior
        $dob65 = $today->copy()->subYears(65)->format('Y-m-d');
        $this->makeSenior('Anibong', [
            'first_name' => 'Younger',
            'last_name' => 'SIXTYFIVE',
            'date_of_birth' => $dob65,
            'age' => 65,
            'status' => 'Active',
        ]);

        Sanctum::actingAs($this->makeStaff());

        $response = $this->get('/api/reports/senior-citizens?min_age=80&max_age=80');

        $response->assertOk();
        $response->assertHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        $this->assertStringContainsString('Age_80', $response->headers->get('Content-Disposition'));

        $reader = IOFactory::createReader('Xlsx');
        $reader->setReadDataOnly(true);
        $book = $reader->load($response->getFile()->getRealPath());

        // Single filtered masterlist sheet
        $this->assertCount(1, $book->getSheetNames());
        $sheetName = $book->getSheetNames()[0];
        $this->assertStringContainsString('Age 80', $sheetName);

        $sheet = $book->getSheetByName($sheetName);
        $this->assertNotNull($sheet);

        $sheetText = $this->sheetText($sheet);
        $this->assertStringContainsString('GENARIAN', $sheetText);
        $this->assertStringNotContainsString('SIXTYFIVE', $sheetText);
        $this->assertStringContainsString('SENIOR CITIZENS MASTERLIST - AGE 80', $sheetText);
        $this->assertStringContainsString('TOTAL SENIORS: 1', $sheetText);
    }
}
