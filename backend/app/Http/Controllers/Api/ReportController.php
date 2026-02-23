<?php

namespace App\Http\Controllers\Api;

use App\Exports\SeniorReport;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Maatwebsite\Excel\Facades\Excel;

class ReportController extends Controller
{
    /**
     * Download the Senior Citizens Statistical Report as .xlsx
     *
     * Query parameters:
     *   - year      (optional) e.g. 2025
     *   - barangay  (optional) e.g. "San Isidro" or "All Barangays"
     *
     * GET /api/reports/senior-citizens
     */
    public function seniorCitizens(Request $request)
    {
        $year = $request->query('year');
        $barangay = $request->query('barangay');

        // Normalise inputs
        $yearInt = ($year && $year !== 'All Years') ? (int) $year : null;
        $barangayStr = ($barangay && $barangay !== 'All Barangays') ? $barangay : null;

        $label = $barangayStr ?? 'All_Barangays';
        $yearLabel = $yearInt ?? 'AllTime';
        $filename = 'Senior_Citizens_Report_' . Str::slug($label, '_') . "_{$yearLabel}.xlsx";

        $export = new SeniorReport(
            $yearInt,
            $barangayStr,
            'Municipality of Pagsanjan, Province of Laguna',
            'Office of Senior Citizens Affairs (OSCA)'
        );

        return Excel::download($export, $filename, \Maatwebsite\Excel\Excel::XLSX, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ]);
    }
}
