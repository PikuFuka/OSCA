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

class MasterlistSheet implements WithTitle, WithEvents
{
    private const FONT_NAME = 'Arial';
    private const MASTERLIST_HEADER_BG = 'C6E0B4';

    protected ?int $year;
    protected ?string $barangay;
    protected string $provinceMunicipality;
    protected string $officeName;
    protected ?string $leftLogoPath;
    protected ?string $rightLogoPath;

    public function __construct(
        ?int $year = null,
        ?string $barangay = null,
        string $provinceMunicipality = 'Municipality of Pagsanjan, Province of Laguna',
        string $officeName = 'Office of Senior Citizens Affairs (OSCA)',
        ?string $leftLogoPath = null,
        ?string $rightLogoPath = null
    ) {
        $this->year = $year;
        $this->barangay = $barangay;
        $this->provinceMunicipality = $provinceMunicipality;
        $this->officeName = $officeName;
        $this->leftLogoPath = $leftLogoPath;
        $this->rightLogoPath = $rightLogoPath;
    }

    public function title(): string
    {
        return 'Masterlist of Pagsanjan';
    }

    public function registerEvents(): array
    {
        return [
            AfterSheet::class => function (AfterSheet $event) {
                /** @var Worksheet $sheet */
                $sheet = $event->sheet->getDelegate();

                $sheet->getPageSetup()->setOrientation(PageSetup::ORIENTATION_LANDSCAPE);
                $sheet->getSheetView()->setZoomScale(70);
                $sheet->getDefaultRowDimension()->setRowHeight(15);

                $query = Senior::query();
                if ($this->year) {
                    $query->where(function ($q) {
                        $q->whereYear('created_at', $this->year)
                          ->orWhereNull('created_at');
                    });
                }
                if ($this->barangay && $this->barangay !== 'All Barangays') {
                    $query->where('barangay', $this->barangay);
                }
                $seniors = $query->orderBy('barangay')->orderBy('last_name')->get();

                // Write Header
                $this->writeHeader($sheet);
                $this->addHeaderLogos($sheet);

                // Write Masterlist
                $this->writeMasterlist($sheet, 7, $seniors);

                // Font and Autofit
                $highestRow = $sheet->getHighestRow();
                $sheet->getStyle('A1:T' . $highestRow)->getFont()->setName(self::FONT_NAME);
                foreach (range('A', 'T') as $col) {
                    $sheet->getColumnDimension($col)->setAutoSize(true);
                }
            }
        ];
    }

    private function writeHeader(Worksheet $sheet): void
    {
        $sheet->mergeCells('A1:T1');
        $sheet->setCellValue('A1', 'Republic of the Philippines');
        $sheet->getStyle('A1')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

        $sheet->mergeCells('A2:T2');
        $sheet->setCellValue('A2', $this->provinceMunicipality);
        $sheet->getStyle('A2')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

        $sheet->mergeCells('A3:T3');
        $sheet->setCellValue('A3', $this->officeName);
        $sheet->getStyle('A3')->getFont()->setBold(true)->setSize(12);
        $sheet->getStyle('A3')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

        $sheet->mergeCells('A5:T5');
        $title = 'SENIOR CITIZENS MASTERLIST';
        if ($this->year) $title .= ' - ' . $this->year;
        $sheet->setCellValue('A5', $title);
        $sheet->getStyle('A5')->getFont()->setBold(true)->setSize(14);
        $sheet->getStyle('A5')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
    }

    private function addHeaderLogos(Worksheet $sheet): void
    {
        if ($this->leftLogoPath && file_exists($this->leftLogoPath)) {
            $drawingLeft = new Drawing();
            $drawingLeft->setName('Left Logo');
            $drawingLeft->setPath($this->leftLogoPath);
            $drawingLeft->setHeight(110);
            $drawingLeft->setCoordinates('G1');
            $drawingLeft->setOffsetY(5);
            $drawingLeft->setWorksheet($sheet);
        }

        if ($this->rightLogoPath && file_exists($this->rightLogoPath)) {
            $drawingRight = new Drawing();
            $drawingRight->setName('Right Logo');
            $drawingRight->setPath($this->rightLogoPath);
            $drawingRight->setHeight(110);
            $drawingRight->setCoordinates('M1');
            $drawingRight->setOffsetY(5);
            $drawingRight->setWorksheet($sheet);
        }
    }

    private function writeMasterlist(Worksheet $sheet, int $startRow, $seniors): void
    {
        $headers = [
            'SORT SEQ', 'FULL NAME', 'LAST NAME', 'FIRST NAME', 'MIDDLE NAME', 'EXT',
            'ADDRESS', 'BARANGAY', 'GENDER', 'DATE OF BIRTH', 'MONTH', 'DAY', 'YEAR',
            'AGE', 'CONTACT NUMBER', 'OSCA ID NO.', 'RRN NO.', 'NATIONAL ID NO.',
            'STATUS', 'DATE REGISTERED'
        ];

        foreach ($headers as $index => $label) {
            $col = $this->getColumnLetter($index);
            $sheet->setCellValue($col . $startRow, $label);
        }

        $headerRange = 'A' . $startRow . ':T' . $startRow;
        $sheet->getStyle($headerRange)->applyFromArray([
            'font' => ['bold' => true],
            'fill' => [
                'fillType' => Fill::FILL_SOLID,
                'startColor' => ['rgb' => self::MASTERLIST_HEADER_BG],
            ],
            'borders' => [
                'allBorders' => ['borderStyle' => Border::BORDER_THIN],
            ],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER]
        ]);

        $currentRow = $startRow + 1;
        foreach ($seniors as $index => $senior) {
            $fullName = strtoupper("{$senior->last_name}, {$senior->first_name} " . ($senior->middle_name ? substr($senior->middle_name, 0, 1) . "." : ""));
            
            $dob = $senior->date_of_birth;
            
            $sheet->setCellValue('A' . $currentRow, $index + 1);
            $sheet->setCellValue('B' . $currentRow, $fullName);
            $sheet->setCellValue('C' . $currentRow, $senior->last_name);
            $sheet->setCellValue('D' . $currentRow, $senior->first_name);
            $sheet->setCellValue('E' . $currentRow, $senior->middle_name);
            $sheet->setCellValue('F' . $currentRow, $senior->extension_name);
            $sheet->setCellValue('G' . $currentRow, $senior->street_address);
            $sheet->setCellValue('H' . $currentRow, $senior->barangay);
            $sheet->setCellValue('I' . $currentRow, $senior->sex);
            $sheet->setCellValue('J' . $currentRow, $dob ? $dob->format('m/d/Y') : '');
            $sheet->setCellValue('K' . $currentRow, $dob ? $dob->format('m') : '');
            $sheet->setCellValue('L' . $currentRow, $dob ? $dob->format('d') : '');
            $sheet->setCellValue('M' . $currentRow, $dob ? $dob->format('Y') : '');
            $sheet->setCellValue('N' . $currentRow, $senior->age);
            $sheet->setCellValue('O' . $currentRow, $senior->contact_number);
            $sheet->setCellValue('P' . $currentRow, $senior->osca_id);
            $sheet->setCellValue('Q' . $currentRow, $senior->rrn);
            $sheet->setCellValue('R' . $currentRow, $senior->national_id);
            $sheet->setCellValue('S' . $currentRow, ucfirst($senior->status));
            $sheet->setCellValue('T' . $currentRow, $senior->created_at ? $senior->created_at->format('m/d/Y') : '');

            $sheet->getStyle('A' . $currentRow . ':T' . $currentRow)->getBorders()->getAllBorders()->setBorderStyle(Border::BORDER_THIN);
            $currentRow++;
        }

        $sheet->setAutoFilter('A' . $startRow . ':T' . ($currentRow - 1));
    }

    private function getColumnLetter(int $index): string
    {
        return \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($index + 1);
    }
}
