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
     *   - min_age   (optional) e.g. 80
     *   - max_age   (optional) e.g. 80
     *   - category  (optional) e.g. "National", "Pensioner", "Indigent"
     *   - search    (optional) search term
     *   - status    (optional) e.g. "Active"
     *   - sort      (optional) sort field e.g. "last_name"
     *   - order     (optional) sort direction e.g. "asc"
     *   - filtered  (optional) boolean flag forcing filtered single-sheet masterlist
     *
     * GET /api/reports/senior-citizens
     */
    public function seniorCitizens(Request $request)
    {
        $year = $request->query('year');
        $barangay = $request->query('barangay');
        $minAge = ($request->has('min_age') && is_numeric($request->query('min_age'))) ? (int) $request->query('min_age') : null;
        $maxAge = ($request->has('max_age') && is_numeric($request->query('max_age'))) ? (int) $request->query('max_age') : null;
        $category = $request->query('category');
        $search = $request->query('search');
        $status = $request->query('status');
        $sort = $request->query('sort');
        $order = $request->query('order');
        $filtered = $request->boolean('filtered')
            || $minAge !== null
            || $maxAge !== null
            || ($category && $category !== 'All Categories')
            || !empty($search);

        $yearInt = ($year && $year !== 'All Years') ? (int) $year : null;
        $barangayStr = ($barangay && $barangay !== 'All Barangays') ? $barangay : null;

        // Queueable path — Excel with 10k rows blocks PHP-FPM; dispatch to file queue (database driver)
        if ($request->boolean('async') || $request->boolean('queue')) {
            \App\Jobs\GenerateReportJob::dispatch(
                $yearInt,
                $barangayStr,
                $request->user()->id,
                $minAge,
                $maxAge,
                $category,
                $search,
                $status,
                $sort,
                $order,
                $filtered
            );
            return response()->json(['queued'=>true,'message'=>'Report queued via file queue. Check storage/app/private/reports/ after queue:work.'], 202);
        }

        $parts = ['Senior_Citizens_Report'];
        if ($barangayStr) {
            $parts[] = Str::slug($barangayStr, '_');
        } else {
            $parts[] = 'All_Barangays';
        }

        if ($minAge !== null && $maxAge !== null) {
            $parts[] = ($minAge === $maxAge) ? "Age_{$minAge}" : "Age_{$minAge}_{$maxAge}";
        } elseif ($minAge !== null) {
            $parts[] = "Age_{$minAge}_Plus";
        } elseif ($maxAge !== null) {
            $parts[] = "Age_UpTo_{$maxAge}";
        }

        if ($category && $category !== 'All Categories') {
            $parts[] = Str::slug($category, '_');
        }

        if ($yearInt) {
            $parts[] = $yearInt;
        }

        $filename = implode('_', $parts) . '.xlsx';

        $export = new SeniorReport(
            $yearInt,
            $barangayStr,
            'Municipality of Pagsanjan, Province of Laguna',
            'Office of Senior Citizens Affairs (OSCA)',
            $minAge,
            $maxAge,
            $category,
            $search,
            $status,
            $sort,
            $order,
            $filtered
        );

        return Excel::download($export, $filename, \Maatwebsite\Excel\Excel::XLSX, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ]);
    }
}
