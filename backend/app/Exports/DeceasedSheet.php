<?php

namespace App\Exports;

/**
 * Consolidated listing of deceased senior citizens.
 *
 * Shares the masterlist layout with {@see MasterlistSheet} but only includes
 * records whose status is "Deceased". This keeps the living masterlist free
 * of deceased members while preserving their records in a dedicated tab.
 */
class DeceasedSheet extends MasterlistSheet
{
    public function __construct(
        ?int $year = null,
        ?string $barangay = null,
        string $provinceMunicipality = 'Municipality of Pagsanjan, Province of Laguna',
        string $officeName = 'Office of Senior Citizens Affairs (OSCA)',
        ?string $leftLogoPath = null,
        ?string $rightLogoPath = null
    ) {
        parent::__construct(
            $year,
            $barangay,
            $provinceMunicipality,
            $officeName,
            $leftLogoPath,
            $rightLogoPath,
            true
        );
    }
}
