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
    protected bool $deceasedOnly;
    protected ?int $minAge;
    protected ?int $maxAge;
    protected ?string $category;
    protected ?string $search;
    protected ?string $status;
    protected ?string $sortBy;
    protected ?string $sortOrder;
    protected ?string $customTitle;

    public function __construct(
        ?int $year = null,
        ?string $barangay = null,
        string $provinceMunicipality = 'Municipality of Pagsanjan, Province of Laguna',
        string $officeName = 'Office of Senior Citizens Affairs (OSCA)',
        ?string $leftLogoPath = null,
        ?string $rightLogoPath = null,
        bool $deceasedOnly = false,
        ?int $minAge = null,
        ?int $maxAge = null,
        ?string $category = null,
        ?string $search = null,
        ?string $status = null,
        ?string $sortBy = null,
        ?string $sortOrder = null,
        ?string $customTitle = null
    ) {
        $this->year = $year;
        $this->barangay = $barangay;
        $this->provinceMunicipality = $provinceMunicipality;
        $this->officeName = $officeName;
        $this->leftLogoPath = $leftLogoPath;
        $this->rightLogoPath = $rightLogoPath;
        $this->deceasedOnly = $deceasedOnly;
        $this->minAge = $minAge;
        $this->maxAge = $maxAge;
        $this->category = $category;
        $this->search = $search;
        $this->status = $status;
        $this->sortBy = $sortBy;
        $this->sortOrder = $sortOrder;
        $this->customTitle = $customTitle;
    }

    public function title(): string
    {
        if ($this->customTitle) {
            $cleaned = preg_replace('/[\\\\\/\?\*\[\]\:]/', '', $this->customTitle);
            return mb_substr($cleaned, 0, 31);
        }

        if ($this->minAge !== null || $this->maxAge !== null) {
            if ($this->minAge !== null && $this->maxAge !== null) {
                $ageStr = ($this->minAge === $this->maxAge) ? "Age {$this->minAge}" : "Age {$this->minAge}-{$this->maxAge}";
            } elseif ($this->minAge !== null) {
                $ageStr = "Age {$this->minAge}+";
            } else {
                $ageStr = "Age up to {$this->maxAge}";
            }

            if ($this->barangay && $this->barangay !== 'All Barangays') {
                $name = "{$this->barangay} - {$ageStr}";
            } else {
                $name = "Masterlist - {$ageStr}";
            }
            $cleaned = preg_replace('/[\\\\\/\?\*\[\]\:]/', '', $name);
            return mb_substr($cleaned, 0, 31);
        }

        if ($this->barangay && $this->barangay !== 'All Barangays') {
            $prefix = $this->deceasedOnly ? 'Deceased' : 'Masterlist';
            $name = substr($prefix . ' - ' . $this->barangay, 0, 31);
            return preg_replace('/[\\\\\/\?\*\[\]\:]/', '', $name);
        }

        return $this->deceasedOnly ? 'Deceased of Pagsanjan' : 'Masterlist of Pagsanjan';
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

                // Status filter
                if ($this->deceasedOnly) {
                    $query->where('status', 'Deceased');
                } elseif ($this->status && $this->status !== 'All') {
                    $query->where('status', $this->status);
                } else {
                    $query->where(function ($q) {
                        $q->whereNull('status')->orWhere('status', '!=', 'Deceased');
                    });
                }

                if ($this->year) {
                    $query->where(function ($q) {
                        $q->whereYear('created_at', $this->year)
                          ->orWhereNull('created_at');
                    });
                }

                if ($this->barangay && $this->barangay !== 'All Barangays') {
                    $barangay = trim((string) $this->barangay);
                    $candidates = [$barangay];
                    $toLatin1 = @mb_convert_encoding($barangay, 'ISO-8859-1', 'UTF-8');
                    if (is_string($toLatin1) && $toLatin1 !== '' && $toLatin1 !== $barangay) {
                        $candidates[] = $toLatin1;
                    }
                    $toUtf8 = @mb_convert_encoding($barangay, 'UTF-8', 'ISO-8859-1');
                    if (is_string($toUtf8) && $toUtf8 !== '' && $toUtf8 !== $barangay) {
                        $candidates[] = $toUtf8;
                    }
                    $candidates = array_values(array_unique(array_filter($candidates, fn ($v) => $v !== '')));
                    $query->whereIn('barangay', $candidates);
                }

                if ($this->search) {
                    $search = trim($this->search);
                    $terms = preg_split('/\s+/', $search) ?: [];
                    $terms = array_values(array_filter($terms, fn($t) => $t !== ''));
                    $query->where(function ($q) use ($search, $terms) {
                        $q->where('osca_id', 'like', "%{$search}%");
                        foreach ($terms as $term) {
                            $q->orWhere('first_name', 'like', "%{$term}%")
                              ->orWhere('last_name', 'like', "%{$term}%")
                              ->orWhere('middle_name', 'like', "%{$term}%")
                              ->orWhere('contact_number', 'like', "%{$term}%");
                        }
                    });
                }

                // Age filters based on exact DOB and placeholder fallback
                $today = Carbon::today();
                if ($this->minAge !== null && (int) $this->minAge >= 0) {
                    $min = (int) $this->minAge;
                    $bornOnOrBefore = $today->copy()->subYears($min)->toDateString();
                    $query->where(function ($ageQuery) use ($bornOnOrBefore, $min) {
                        $ageQuery->where(function ($realDob) use ($bornOnOrBefore) {
                            $realDob->whereDate('date_of_birth', '>', Senior::PLACEHOLDER_DATE_OF_BIRTH)
                                ->whereDate('date_of_birth', '<=', $bornOnOrBefore);
                        })->orWhere(function ($fallback) use ($min) {
                            $fallback->where(function ($unknownDob) {
                                $unknownDob->whereNull('date_of_birth')
                                    ->orWhereDate('date_of_birth', Senior::PLACEHOLDER_DATE_OF_BIRTH);
                            })->whereBetween('age', [$min, Senior::MAX_VERIFIED_HUMAN_AGE]);
                        });
                    });
                }

                if ($this->maxAge !== null && (int) $this->maxAge >= 0) {
                    $max = (int) $this->maxAge;
                    $bornAfter = $today->copy()->subYears($max + 1)->toDateString();
                    $query->where(function ($ageQuery) use ($bornAfter, $max) {
                        $ageQuery->where(function ($realDob) use ($bornAfter) {
                            $realDob->whereDate('date_of_birth', '>', Senior::PLACEHOLDER_DATE_OF_BIRTH)
                                ->whereDate('date_of_birth', '>', $bornAfter);
                        })->orWhere(function ($fallback) use ($max) {
                            $fallback->where(function ($unknownDob) {
                                $unknownDob->whereNull('date_of_birth')
                                    ->orWhereDate('date_of_birth', Senior::PLACEHOLDER_DATE_OF_BIRTH);
                            })->where('age', '<=', $max);
                        });
                    });
                }

                if ($this->category && $this->category !== 'All Categories') {
                    $category = $this->category;
                    $query->where(function ($q) use ($category) {
                        $lower = strtolower(trim((string) $category));
                        if ($lower === 'national') {
                            $q->whereRaw('LOWER(pension_status) LIKE ?', ['%national%']);
                        } elseif ($lower === 'local') {
                            $q->whereRaw('LOWER(pension_status) LIKE ?', ['%local%']);
                        } elseif ($lower === 'pensioner') {
                            $q->whereRaw('LOWER(pension_status) LIKE ?', ['%pensioner%'])
                              ->whereRaw('LOWER(pension_status) NOT LIKE ?', ['%social%']);
                        } elseif ($lower === 'indigent') {
                            $q->whereRaw('LOWER(pension_status) LIKE ?', ['%indigent%']);
                        } elseif ($lower === 'none') {
                            $q->where('pension_status', 'None')->orWhereNull('pension_status');
                        } else {
                            $q->where('pension_status', $category);
                        }
                    });
                }

                // Sorting
                $sortBy = $this->sortBy ?: 'barangay';
                $sortOrder = strtolower($this->sortOrder ?: 'asc') === 'desc' ? 'desc' : 'asc';
                if ($sortBy === 'barangay') {
                    $query->orderBy('barangay', $sortOrder)->orderBy('last_name', 'asc');
                } elseif ($sortBy === 'age') {
                    $query->orderBy('date_of_birth', $sortOrder === 'desc' ? 'asc' : 'desc')
                          ->orderBy('age', $sortOrder);
                } else {
                    $allowedCols = ['last_name', 'first_name', 'created_at', 'updated_at', 'barangay', 'status'];
                    if (in_array($sortBy, $allowedCols)) {
                        $query->orderBy($sortBy, $sortOrder);
                    } else {
                        $query->orderBy('barangay')->orderBy('last_name');
                    }
                }

                $seniors = $query->get();

                // Write Header
                $this->writeHeader($sheet);
                $this->addHeaderLogos($sheet);

                $sheet->mergeCells('A6:T6');
                $countLabel = $this->deceasedOnly ? 'TOTAL DECEASED SENIORS: ' : 'TOTAL SENIORS: ';
                $sheet->setCellValue('A6', $countLabel . $seniors->count());
                $sheet->getStyle('A6')->getFont()->setBold(true)->setSize(11);
                $sheet->getStyle('A6')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

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
        $title = $this->deceasedOnly ? 'DECEASED SENIOR CITIZENS' : 'SENIOR CITIZENS MASTERLIST';
        if ($this->year) $title .= ' - ' . $this->year;
        if ($this->barangay && $this->barangay !== 'All Barangays') $title .= ' - ' . mb_strtoupper($this->barangay);
        if ($this->minAge !== null && $this->maxAge !== null) {
            if ($this->minAge === $this->maxAge) {
                $title .= ' - AGE ' . $this->minAge;
            } else {
                $title .= ' - AGES ' . $this->minAge . ' TO ' . $this->maxAge;
            }
        } elseif ($this->minAge !== null) {
            $title .= ' - AGE ' . $this->minAge . '+';
        } elseif ($this->maxAge !== null) {
            $title .= ' - AGE UP TO ' . $this->maxAge;
        }
        if ($this->category && $this->category !== 'All Categories') {
            $title .= ' (' . mb_strtoupper($this->category) . ')';
        }
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
            $hasKnownDob = $senior->hasKnownDateOfBirth();
            
            $sheet->setCellValue('A' . $currentRow, $index + 1);
            $sheet->setCellValue('B' . $currentRow, $fullName);
            $sheet->setCellValue('C' . $currentRow, $senior->last_name);
            $sheet->setCellValue('D' . $currentRow, $senior->first_name);
            $sheet->setCellValue('E' . $currentRow, $senior->middle_name);
            $sheet->setCellValue('F' . $currentRow, $senior->extension_name);
            $sheet->setCellValue('G' . $currentRow, $senior->street_address);
            $sheet->setCellValue('H' . $currentRow, $senior->barangay);
            $sheet->setCellValue('I' . $currentRow, $senior->sex);
            $sheet->setCellValue('J' . $currentRow, ($dob && $hasKnownDob) ? $dob->format('m/d/Y') : '');
            $sheet->setCellValue('K' . $currentRow, ($dob && $hasKnownDob) ? $dob->format('m') : '');
            $sheet->setCellValue('L' . $currentRow, ($dob && $hasKnownDob) ? $dob->format('d') : '');
            $sheet->setCellValue('M' . $currentRow, ($dob && $hasKnownDob) ? $dob->format('Y') : '');
            $sheet->setCellValue('N' . $currentRow, $senior->resolvedAge());
            $sheet->setCellValue('O' . $currentRow, $senior->contact_number);
            $sheet->setCellValue('P' . $currentRow, $senior->displayOscaId());
            $sheet->setCellValue('Q' . $currentRow, $senior->rrn);
            $sheet->setCellValue('R' . $currentRow, $senior->national_id);
            $sheet->setCellValue('S' . $currentRow, ucfirst($senior->status));
            $sheet->setCellValue('T' . $currentRow, $senior->created_at ? $senior->created_at->format('m/d/Y') : '');

            $sheet->getStyle('A' . $currentRow . ':T' . $currentRow)->getBorders()->getAllBorders()->setBorderStyle(Border::BORDER_THIN);
            $currentRow++;
        }

        if ($seniors->count() > 0) {
            $sheet->setAutoFilter('A' . $startRow . ':T' . ($currentRow - 1));
        }
    }

    private function getColumnLetter(int $index): string
    {
        return \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($index + 1);
    }
}
