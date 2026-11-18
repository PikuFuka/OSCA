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

                // Data: fetch the barangay population once and derive the
                // registered-in-period subset in memory instead of running a
                // second full query for every barangay tab.
                $populationQuery = Senior::query()->where('barangay', $this->barangay);
                if ($this->year) {
                    $populationQuery->where(function ($q) {
                        $q->where('created_at', '<=', Carbon::create($this->year, 12, 31, 23, 59, 59))
                          ->orWhereNull('created_at');
                    });
                }
                $population = $populationQuery->get();

                $registeredInPeriod = $this->year
                    ? $population->filter(
                        fn ($senior) => !$senior->created_at
                            || (int) $senior->created_at->format('Y') === $this->year
                    )
                    : $population;

                // Header + logos
                $nextRow = $this->writeHeader($sheet);
                $this->addHeaderLogos($sheet);

                // Sections
                $nextRow = $this->writeMonthlyRegistrations($sheet, $nextRow, $registeredInPeriod);
                $nextRow = $this->writeGenderDistribution($sheet, $nextRow, $population);
                $nextRow = $this->writeAgeDistribution($sheet, $nextRow, $population);
                $nextRow = $this->writeDeceasedPerMonth($sheet, $nextRow, $registeredInPeriod);
                $nextRow = $this->writeSummary($sheet, $nextRow, $population);

                // Keep living and deceased members in separate tables so each
                // barangay tab mirrors the consolidated masterlist/deceased tabs.
                $livingSeniors = $population
                    ->filter(fn ($senior) => strtolower((string) $senior->status) !== 'deceased')
                    ->values();
                $deceasedSeniors = $population
                    ->filter(fn ($senior) => strtolower((string) $senior->status) === 'deceased')
                    ->values();

                $nextRow = $this->writeMasterlist(
                    $sheet,
                    $nextRow,
                    $livingSeniors,
                    'VI. MASTERLIST OF LIVING SENIORS (PER BARANGAY)',
                    true
                );
                $nextRow += 2;

                $nextRow = $this->writeMasterlist(
                    $sheet,
                    $nextRow,
                    $deceasedSeniors,
                    'VII. DECEASED SENIORS (PER BARANGAY)',
                    false
                );

                // Final styling: font and fixed widths. Fixed widths avoid the
                // expensive per-column content scan that auto-size performs on
                // every barangay tab, and match the consolidated masterlist.
                $sheet->getParent()->getDefaultStyle()->getFont()->setName(self::FONT_NAME);
                $widths = [
                    'A' => 10, 'B' => 28, 'C' => 18, 'D' => 18, 'E' => 18,
                    'F' => 8, 'G' => 32, 'H' => 20, 'I' => 10, 'J' => 14,
                    'K' => 8, 'L' => 8, 'M' => 10, 'N' => 8, 'O' => 16,
                    'P' => 16, 'Q' => 16, 'R' => 18, 'S' => 12, 'T' => 16,
                ];
                foreach ($widths as $col => $width) {
                    $sheet->getColumnDimension($col)->setWidth($width);
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
        $counts = array_fill(1, 12, 0);
        foreach ($seniors as $senior) {
            if ($senior->created_at) {
                $counts[(int) $senior->created_at->format('m')]++;
            }
        }
        $total = 0;
        for ($m = 1; $m <= 12; $m++) {
            $count = $counts[$m];
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

        $counts = array_fill_keys(array_keys($ranges), 0);
        foreach ($seniors as $senior) {
            $age = $senior->resolvedAge();
            if ($age === null) {
                continue;
            }
            foreach ($ranges as $label => [$min, $max]) {
                if ($age >= $min && $age <= $max) {
                    $counts[$label]++;
                    break;
                }
            }
        }

        foreach ($ranges as $label => [$min, $max]) {
            $sheet->setCellValue("A{$row}", $label);
            $sheet->setCellValue("B{$row}", $counts[$label]);
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

        $sheet->setCellValue("A{$row}", 'Count');
        $counts = array_fill(1, 12, 0);
        foreach ($seniorsInPeriod as $senior) {
            if ($senior->status !== 'Deceased' || !$senior->updated_at) {
                continue;
            }
            $counts[(int) $senior->updated_at->format('m')]++;
        }
        $total = 0;
        for ($m = 1; $m <= 12; $m++) {
            $count = $counts[$m];
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

    private function writeMasterlist(
        Worksheet $sheet,
        int $row,
        $seniors,
        string $title,
        bool $withAutoFilter
    ): int {
        $this->writeSectionTitle($sheet, $row, $title, 'A', 'T');
        $row++;
        $headerRow = $row;

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

        $headerRange = "A{$headerRow}:T{$headerRow}";
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
        $sheet->getRowDimension($headerRow)->setRowHeight(20);

        $row++;
        $seq = 1;
        $firstDataRow = $row;

        $sorted = $seniors->sortBy(['last_name', 'first_name'])->values();
        $rows = [];
        foreach ($sorted as $senior) {
            $dob = $senior->date_of_birth ? Carbon::parse($senior->date_of_birth) : null;
            $rows[] = [
                $seq++,
                $senior->full_name,
                $senior->last_name,
                $senior->first_name,
                $senior->middle_name ?? '',
                $senior->extension_name ?? '',
                $senior->street_address ?? '',
                $senior->barangay ?? '',
                $senior->sex ?? '',
                $dob ? $dob->format('m/d/Y') : '',
                $dob ? $dob->format('m') : '',
                $dob ? $dob->format('d') : '',
                $dob ? $dob->format('Y') : '',
                $senior->resolvedAge() ?? '',
                $senior->contact_number ?? '',
                $senior->displayOscaId() ?? '',
                $senior->rrn ?? '',
                $senior->national_id ?? '',
                $senior->status ?? '',
                $senior->created_at ? $senior->created_at->format('m/d/Y') : '',
            ];
        }

        if ($rows !== []) {
            $sheet->fromArray($rows, null, "A{$firstDataRow}", true);
            $this->applyTableBody($sheet, "A{$firstDataRow}:T" . ($firstDataRow + count($rows) - 1));
            $row = $firstDataRow + count($rows);
        }

        // A worksheet only supports one auto-filter. Keep it on the living
        // masterlist table (full data range) and leave the deceased table
        // unfiltered.
        if ($withAutoFilter) {
            $sheet->setAutoFilter("A{$headerRow}:T" . ($row - 1));
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
