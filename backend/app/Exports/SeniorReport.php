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
        string $officeName = 'Office of Senior Citizens Affairs (OSCA)'
    ) {
        $this->year = $year;
        $this->barangay = $barangay;
        $this->provinceMunicipality = $provinceMunicipality;
        $this->officeName = $officeName;
    }

    /**
     * Generate one worksheet (tab) per barangay.
     *
     * @return array<BarangaySheet>
     */
    public function sheets(): array
    {
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

        $leftLogoPath = base_path('../frontend/img/pjn_logo.png');
        $rightLogoPath = base_path('../frontend/img/osca_logo.png');

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

        // Add consolidated Masterlist tab
        $sheets[] = new MasterlistSheet(
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
