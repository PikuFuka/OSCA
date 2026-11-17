<?php

namespace App\Exports;

use App\Models\Senior;
use Maatwebsite\Excel\Concerns\WithMultipleSheets;

class SeniorReport implements WithMultipleSheets
{
    protected ?int $year;
    protected ?string $barangay;
    protected string $provinceMunicipality;
    protected string $officeName;
    protected ?int $minAge;
    protected ?int $maxAge;
    protected ?string $category;
    protected ?string $search;
    protected ?string $status;
    protected ?string $sortBy;
    protected ?string $sortOrder;
    protected bool $filtered;

    /**
     * @param int|null    $year                  Filter by registration year (null = all time)
     * @param string|null $barangay              Single barangay filter (null = all barangays)
     * @param string      $provinceMunicipality  Province/Municipality label for the header
     * @param string      $officeName            Office name for the header
     */
    public function __construct(
        ?int $year = null,
        ?string $barangay = null,
        string $provinceMunicipality = 'Municipality of Pagsanjan, Province of Laguna',
        string $officeName = 'Office of Senior Citizens Affairs (OSCA)',
        ?int $minAge = null,
        ?int $maxAge = null,
        ?string $category = null,
        ?string $search = null,
        ?string $status = null,
        ?string $sortBy = null,
        ?string $sortOrder = null,
        bool $filtered = false
    ) {
        $this->year = $year;
        $this->barangay = $barangay;
        $this->provinceMunicipality = $provinceMunicipality;
        $this->officeName = $officeName;
        $this->minAge = $minAge;
        $this->maxAge = $maxAge;
        $this->category = $category;
        $this->search = $search;
        $this->status = $status;
        $this->sortBy = $sortBy;
        $this->sortOrder = $sortOrder;
        $this->filtered = $filtered;
    }

    public function isFiltered(): bool
    {
        return $this->filtered
            || $this->minAge !== null
            || $this->maxAge !== null
            || ($this->category !== null && $this->category !== '' && $this->category !== 'All Categories')
            || (!empty($this->search));
    }

    /**
     * Generate one worksheet per barangay plus consolidated living
     * masterlist and deceased tabs for full reports.
     * When filters are active, generate only the filtered MasterlistSheet.
     *
     * @return array<BarangaySheet|MasterlistSheet|DeceasedSheet>
     */
    public function sheets(): array
    {
        $leftLogoPath = base_path('../frontend/img/pjn_logo.png');
        $rightLogoPath = base_path('../frontend/img/osca_logo.png');

        if ($this->isFiltered()) {
            return [
                new MasterlistSheet(
                    $this->year,
                    $this->barangay,
                    $this->provinceMunicipality,
                    $this->officeName,
                    $leftLogoPath,
                    $rightLogoPath,
                    false,
                    $this->minAge,
                    $this->maxAge,
                    $this->category,
                    $this->search,
                    $this->status ?? 'Active',
                    $this->sortBy,
                    $this->sortOrder
                )
            ];
        }

        // Determine which barangays to include
        if ($this->barangay && $this->barangay !== 'All Barangays') {
            $barangays = collect([$this->barangay]);
        } else {
            $barangays = Senior::select('barangay')
                ->distinct()
                ->orderBy('barangay')
                ->pluck('barangay')
                ->filter(); // remove nulls/empty
        }

        $sheets = [];

        foreach ($barangays as $barangay) {
            $sheets[] = new BarangaySheet(
                $barangay,
                $this->year,
                $this->provinceMunicipality,
                $this->officeName,
                $leftLogoPath,
                $rightLogoPath,
            );
        }

        // Add consolidated Masterlist tab (living members only)
        $sheets[] = new MasterlistSheet(
            $this->year,
            $this->barangay,
            $this->provinceMunicipality,
            $this->officeName,
            $leftLogoPath,
            $rightLogoPath,
        );

        // Add consolidated Deceased tab
        $sheets[] = new DeceasedSheet(
            $this->year,
            $this->barangay,
            $this->provinceMunicipality,
            $this->officeName,
            $leftLogoPath,
            $rightLogoPath,
        );

        // Edge case: no barangays at all → create a placeholder sheet
        if (empty($sheets)) {
            $sheets[] = new BarangaySheet(
                'No Data',
                $this->year,
                $this->provinceMunicipality,
                $this->officeName,
                $leftLogoPath,
                $rightLogoPath,
            );
        }

        return $sheets;
    }
}
