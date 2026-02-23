<?php

namespace App\Exports;

use App\Models\Senior;
use Illuminate\Support\Carbon;
use Maatwebsite\Excel\Concerns\WithEvents;
use Maatwebsite\Excel\Concerns\WithTitle;
use Maatwebsite\Excel\Events\AfterSheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Worksheet\Drawing;
use PhpOffice\PhpSpreadsheet\Worksheet\PageSetup;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class BarangaySheet implements WithTitle, WithEvents
{
    private const FONT_NAME = 'Arial';
    private const BORDER_COLOR = '000000';
    private const SECTION_BG = 'D9E1F2';
    private const TABLE_HEADER_BG = '1F4E79';
    private const MASTERLIST_HEADER_BG = 'C6E0B4';

    protected string $barangay;
    protected ?int $year;
    protected string $provinceMunicipality;
    protected string $officeName;
    protected ?string $leftLogoPath;
    protected ?string $rightLogoPath;

    public function __construct(
        string $barangay,
        ?int $year = null,
        string $provinceMunicipality = 'Municipality of Pagsanjan, Province of Laguna',
        string $officeName = 'Office of Senior Citizens Affairs (OSCA)',
        ?string $leftLogoPath = null,
        ?string $rightLogoPath = null,
    ) {
        $this->barangay = $barangay;
        $this->year = $year;
        $this->provinceMunicipality = $provinceMunicipality;
        $this->officeName = $officeName;
        $this->leftLogoPath = $leftLogoPath;
        $this->rightLogoPath = $rightLogoPath;
    }

    public function title(): string
    {
        $name = substr($this->barangay, 0, 31);
        return preg_replace('/[\\\\\/\?\*\[\]\:]/', '', $name);
    }

    public function registerEvents(): array
    {
        return [
            AfterSheet::class => function (AfterSheet $event) {
                /** @var Worksheet $sheet */
                $sheet = $event->sheet->getDelegate();

                $sheet->getPageSetup()
                    ->setOrientation(PageSetup::ORIENTATION_LANDSCAPE)
                    ->setPaperSize(PageSetup::PAPERSIZE_A4)
                    ->setFitToWidth(1)
                    ->setFitToHeight(0);
                $sheet->getPageMargins()->setTop(0.4);
                $sheet->getPageMargins()->setBottom(0.4);
                $sheet->getPageMargins()->setLeft(0.4);
                $sheet->getPageMargins()->setRight(0.4);

                $sheet->getSheetView()->setZoomScale(70);

                $sheet->getDefaultRowDimension()->setRowHeight(15);

                // Data
                $baseQuery = Senior::query()->where('barangay', $this->barangay);
                if ($this->year) {
                    $baseQuery->whereYear('created_at', $this->year);
                }
                $registeredInPeriod = (clone $baseQuery)->get();

                $populationQuery = Senior::query()->where('barangay', $this->barangay);
                if ($this->year) {
                    $populationQuery->where('created_at', '<=', Carbon::create($this->year, 12, 31, 23, 59, 59));
                }
                $population = $populationQuery->get();

                // Header + logos
                $nextRow = $this->writeHeader($sheet);
                $this->addHeaderLogos($sheet);

                // Sections
                $nextRow = $this->writeMonthlyRegistrations($sheet, $nextRow, $registeredInPeriod);
                $nextRow = $this->writeGenderDistribution($sheet, $nextRow, $population);
                $nextRow = $this->writeAgeDistribution($sheet, $nextRow, $population);
                $nextRow = $this->writeDeceasedPerMonth($sheet, $nextRow, $registeredInPeriod);
                $nextRow = $this->writeSummary($sheet, $nextRow, $population);
                $nextRow = $this->writeMasterlist($sheet, $nextRow, $population);

                // Final styling: Font and Autofit
                $sheet->getStyle('A1:T' . max($nextRow, 10))->getFont()->setName(self::FONT_NAME);
                foreach (range('A', 'T') as $col) {
                    $sheet->getColumnDimension($col)->setAutoSize(true);
                }

                // Print area
                $sheet->getPageSetup()->setPrintArea('A1:T' . ($nextRow + 1));
            },
        ];
    }

    private function writeHeader(Worksheet $sheet): int
    {
        $reportingPeriod = $this->year ? "January – December {$this->year}" : 'Cumulative';
        $generated = Carbon::now()->format('F d, Y');

        $lines = [
            'Republic of the Philippines',
            $this->provinceMunicipality,
            $this->officeName,
            'SENIOR CITIZENS STATISTICAL REPORT',
            "Barangay: {$this->barangay}",
            "Reporting Period: {$reportingPeriod}    |    Date Generated: {$generated}",
        ];

        foreach ($lines as $i => $text) {
            $row = 1 + $i;
            $sheet->mergeCells("A{$row}:T{$row}");
            $sheet->setCellValue("A{$row}", $text);
            $sheet->getStyle("A{$row}:T{$row}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            $sheet->getStyle("A{$row}:T{$row}")->getFont()->setBold($i === 0 || $i === 3 || $i === 4);
            if ($i === 3) {
                $sheet->getStyle("A{$row}:T{$row}")->getFont()->setSize(14);
            }
        }

        // Give the first row a bit more height for the logos
        $sheet->getRowDimension(1)->setRowHeight(28);

        return 8; // first section starts at row 8
    }

    private function addHeaderLogos(Worksheet $sheet): void
    {
        $left = $this->leftLogoPath ?? base_path('../frontend/img/pjn_logo.png');
        $right = $this->rightLogoPath ?? base_path('../frontend/img/osca_logo.png');

        if (is_file($left)) {
            $drawing = new Drawing();
            $drawing->setName('LGU Logo');
            $drawing->setPath($left);
            $drawing->setHeight(110);
            $drawing->setCoordinates('G1');
            $drawing->setOffsetY(5);
            $drawing->setWorksheet($sheet);
        }

        if (is_file($right)) {
            $drawing = new Drawing();
            $drawing->setName('OSCA Logo');
            $drawing->setPath($right);
            $drawing->setHeight(110);
            $drawing->setCoordinates('M1');
            $drawing->setOffsetY(5);
            $drawing->setWorksheet($sheet);
        }
    }

    private function writeMonthlyRegistrations(Worksheet $sheet, int $row, $seniors): int
    {
        $this->writeSectionTitle($sheet, $row, 'I. SENIOR CITIZENS REGISTERED PER MONTH', 'A', 'M');
        $row++;

        $months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        $sheet->setCellValue('A' . $row, 'Month');
        foreach ($months as $i => $label) {
            $col = chr(ord('B') + $i);
            $sheet->setCellValue("{$col}{$row}", $label);
        }
        $this->applyTableHeader($sheet, "A{$row}:M{$row}");
        $row++;

        $sheet->setCellValue('A' . $row, 'Count');
        $total = 0;
        for ($m = 1; $m <= 12; $m++) {
            $count = $seniors->filter(fn ($s) => (int) $s->created_at->format('m') === $m)->count();
            $total += $count;
            $col = chr(ord('A') + $m); // B..M
            $sheet->setCellValue("{$col}{$row}", $count);
        }
        $this->applyTableBody($sheet, "A{$row}:M{$row}");
        $row++;

        $sheet->setCellValue('A' . $row, 'Total');
        $sheet->setCellValue('B' . $row, $total);
        $sheet->getStyle("A{$row}:B{$row}")->getFont()->setBold(true);
        $this->applyBorders($sheet, "A{$row}:B{$row}");
        $row += 2;

        return $row;
    }

    private function writeGenderDistribution(Worksheet $sheet, int $row, $seniors): int
    {
        $this->writeSectionTitle($sheet, $row, 'II. GENDER DISTRIBUTION', 'A', 'M');
        $row++;

        $sheet->setCellValue("A{$row}", 'Gender');
        $sheet->setCellValue("B{$row}", 'Count');
        $this->applyTableHeader($sheet, "A{$row}:B{$row}");
        $row++;

        $male = $seniors->where('sex', 'Male')->count();
        $female = $seniors->where('sex', 'Female')->count();

        $sheet->setCellValue("A{$row}", 'Male');
        $sheet->setCellValue("B{$row}", $male);
        $this->applyTableBody($sheet, "A{$row}:B{$row}");
        $row++;

        $sheet->setCellValue("A{$row}", 'Female');
        $sheet->setCellValue("B{$row}", $female);
        $this->applyTableBody($sheet, "A{$row}:B{$row}");
        $row += 2;

        return $row;
    }

    private function writeAgeDistribution(Worksheet $sheet, int $row, $seniors): int
    {
        $this->writeSectionTitle($sheet, $row, 'III. AGE RANGE DISTRIBUTION', 'A', 'M');
        $row++;

        $sheet->setCellValue("A{$row}", 'Age Range');
        $sheet->setCellValue("B{$row}", 'Count');
        $this->applyTableHeader($sheet, "A{$row}:B{$row}");
        $row++;

        $ranges = [
            '60–64' => [60, 64],
            '65–69' => [65, 69],
            '70–74' => [70, 74],
            '75–79' => [75, 79],
            '80+' => [80, 200],
        ];

        foreach ($ranges as $label => [$min, $max]) {
            $count = $seniors->filter(fn ($s) => $s->age >= $min && $s->age <= $max)->count();
            $sheet->setCellValue("A{$row}", $label);
            $sheet->setCellValue("B{$row}", $count);
            $this->applyTableBody($sheet, "A{$row}:B{$row}");
            $row++;
        }

        $row += 1;
        return $row;
    }

    private function writeDeceasedPerMonth(Worksheet $sheet, int $row, $seniorsInPeriod): int
    {
        $this->writeSectionTitle($sheet, $row, 'IV. DECEASED SENIOR CITIZENS PER MONTH', 'A', 'M');
        $row++;

        $months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        $sheet->setCellValue("A{$row}", 'Month');
        foreach ($months as $i => $label) {
            $col = chr(ord('B') + $i);
            $sheet->setCellValue("{$col}{$row}", $label);
        }
        $this->applyTableHeader($sheet, "A{$row}:M{$row}");
        $row++;

        $deceased = $seniorsInPeriod->where('status', 'Deceased');

        $sheet->setCellValue("A{$row}", 'Count');
        $total = 0;
        for ($m = 1; $m <= 12; $m++) {
            $count = $deceased->filter(fn ($s) => (int) $s->updated_at->format('m') === $m)->count();
            $total += $count;
            $col = chr(ord('A') + $m); // B..M
            $sheet->setCellValue("{$col}{$row}", $count);
        }
        $this->applyTableBody($sheet, "A{$row}:M{$row}");
        $row++;

        $sheet->setCellValue("A{$row}", 'Total');
        $sheet->setCellValue("B{$row}", $total);
        $sheet->getStyle("A{$row}:B{$row}")->getFont()->setBold(true);
        $this->applyBorders($sheet, "A{$row}:B{$row}");

        $row += 2;
        return $row;
    }

    private function writeSummary(Worksheet $sheet, int $row, $seniors): int
    {
        $this->writeSectionTitle($sheet, $row, 'V. BARANGAY SUMMARY', 'A', 'M');
        $row++;

        $sheet->setCellValue("A{$row}", 'Description');
        $sheet->setCellValue("B{$row}", 'Count');
        $this->applyTableHeader($sheet, "A{$row}:B{$row}");
        $row++;

        $totalRegistered = $seniors->count();
        $totalActive = $seniors->whereIn('status', ['Active', 'active'])->count();
        $totalDeceased = $seniors->whereIn('status', ['Deceased', 'deceased'])->count();
        $male = $seniors->where('sex', 'Male')->count();
        $female = $seniors->where('sex', 'Female')->count();

        $rows = [
            ['Total Registered Seniors', $totalRegistered],
            ['Total Active Seniors', $totalActive],
            ['Total Deceased', $totalDeceased],
            ['Male Count', $male],
            ['Female Count', $female],
        ];

        foreach ($rows as [$label, $count]) {
            $sheet->setCellValue("A{$row}", $label);
            $sheet->setCellValue("B{$row}", $count);
            $this->applyTableBody($sheet, "A{$row}:B{$row}");
            $row++;
        }

        $row += 2;
        return $row;
    }

    private function writeMasterlist(Worksheet $sheet, int $row, $seniors): int
    {
        $this->writeSectionTitle($sheet, $row, 'VI. MASTERLIST (PER BARANGAY)', 'A', 'T');
        $row++;

        $headers = [
            'SORT SEQ',
            'FULL NAME',
            'LAST NAME',
            'FIRST NAME',
            'MIDDLE NAME',
            'EXT',
            'ADDRESS',
            'BARANGAY',
            'GENDER',
            'DATE OF BIRTH',
            'MONTH',
            'DAY',
            'YEAR',
            'AGE',
            'CONTACT NUMBER',
            'OSCA ID NO.',
            'RRN NO.',
            'NATIONAL ID NO.',
            'STATUS',
            'DATE REGISTERED',
        ];

        foreach ($headers as $i => $h) {
            $col = chr(ord('A') + $i); // A..T
            $sheet->setCellValue("{$col}{$row}", $h);
        }

        $headerRange = "A{$row}:T{$row}";
        $sheet->getStyle($headerRange)->applyFromArray([
            'font' => [
                'bold' => true,
                'size' => 10,
            ],
            'alignment' => [
                'horizontal' => Alignment::HORIZONTAL_CENTER,
                'vertical' => Alignment::VERTICAL_CENTER,
                'wrapText' => true,
            ],
            'fill' => [
                'fillType' => Fill::FILL_SOLID,
                'startColor' => ['rgb' => self::MASTERLIST_HEADER_BG],
            ],
            'borders' => [
                'allBorders' => [
                    'borderStyle' => Border::BORDER_THIN,
                    'color' => ['rgb' => self::BORDER_COLOR],
                ],
            ],
        ]);
        $sheet->getRowDimension($row)->setRowHeight(20);

        // Apply filter to just the masterlist block
        $sheet->setAutoFilter($headerRange);

        $row++;
        $seq = 1;

        $sorted = $seniors->sortBy(['last_name', 'first_name'])->values();
        foreach ($sorted as $senior) {
            $dob = $senior->date_of_birth ? Carbon::parse($senior->date_of_birth) : null;
            $sheet->setCellValue("A{$row}", $seq++);
            $sheet->setCellValue("B{$row}", $senior->full_name);
            $sheet->setCellValue("C{$row}", $senior->last_name);
            $sheet->setCellValue("D{$row}", $senior->first_name);
            $sheet->setCellValue("E{$row}", $senior->middle_name ?? '');
            $sheet->setCellValue("F{$row}", $senior->extension_name ?? '');
            $sheet->setCellValue("G{$row}", $senior->street_address ?? '');
            $sheet->setCellValue("H{$row}", $senior->barangay ?? '');
            $sheet->setCellValue("I{$row}", $senior->sex ?? '');
            $sheet->setCellValue("J{$row}", $dob ? $dob->format('m/d/Y') : '');
            $sheet->setCellValue("K{$row}", $dob ? $dob->format('m') : '');
            $sheet->setCellValue("L{$row}", $dob ? $dob->format('d') : '');
            $sheet->setCellValue("M{$row}", $dob ? $dob->format('Y') : '');
            $sheet->setCellValue("N{$row}", $senior->age ?? '');
            $sheet->setCellValue("O{$row}", $senior->contact_number ?? '');
            $sheet->setCellValue("P{$row}", $senior->osca_id ?? '');
            $sheet->setCellValue("Q{$row}", $senior->rrn ?? '');
            $sheet->setCellValue("R{$row}", $senior->national_id ?? '');
            $sheet->setCellValue("S{$row}", $senior->status ?? '');
            $sheet->setCellValue("T{$row}", $senior->created_at ? $senior->created_at->format('m/d/Y') : '');

            $this->applyTableBody($sheet, "A{$row}:T{$row}");
            $row++;
        }

        return $row;
    }

    private function writeSectionTitle(Worksheet $sheet, int $row, string $title, string $fromCol, string $toCol): void
    {
        $sheet->mergeCells("{$fromCol}{$row}:{$toCol}{$row}");
        $sheet->setCellValue("{$fromCol}{$row}", $title);
        $sheet->getStyle("{$fromCol}{$row}:{$toCol}{$row}")->applyFromArray([
            'font' => [
                'bold' => true,
                'size' => 11,
            ],
            'alignment' => [
                'horizontal' => Alignment::HORIZONTAL_LEFT,
                'vertical' => Alignment::VERTICAL_CENTER,
            ],
            'fill' => [
                'fillType' => Fill::FILL_SOLID,
                'startColor' => ['rgb' => self::SECTION_BG],
            ],
            'borders' => [
                'allBorders' => [
                    'borderStyle' => Border::BORDER_THIN,
                    'color' => ['rgb' => self::BORDER_COLOR],
                ],
            ],
        ]);
    }

    private function applyTableHeader(Worksheet $sheet, string $range): void
    {
        $sheet->getStyle($range)->applyFromArray([
            'font' => [
                'bold' => true,
                'color' => ['rgb' => 'FFFFFF'],
                'size' => 10,
            ],
            'alignment' => [
                'horizontal' => Alignment::HORIZONTAL_CENTER,
                'vertical' => Alignment::VERTICAL_CENTER,
                'wrapText' => true,
            ],
            'fill' => [
                'fillType' => Fill::FILL_SOLID,
                'startColor' => ['rgb' => self::TABLE_HEADER_BG],
            ],
            'borders' => [
                'allBorders' => [
                    'borderStyle' => Border::BORDER_THIN,
                    'color' => ['rgb' => self::BORDER_COLOR],
                ],
            ],
        ]);
    }

    private function applyTableBody(Worksheet $sheet, string $range): void
    {
        $sheet->getStyle($range)->applyFromArray([
            'alignment' => [
                'vertical' => Alignment::VERTICAL_CENTER,
            ],
            'borders' => [
                'allBorders' => [
                    'borderStyle' => Border::BORDER_THIN,
                    'color' => ['rgb' => self::BORDER_COLOR],
                ],
            ],
        ]);
    }

    private function applyBorders(Worksheet $sheet, string $range): void
    {
        $sheet->getStyle($range)->applyFromArray([
            'borders' => [
                'allBorders' => [
                    'borderStyle' => Border::BORDER_THIN,
                    'color' => ['rgb' => self::BORDER_COLOR],
                ],
            ],
        ]);
    }

}
