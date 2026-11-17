<?php

namespace App\Jobs;

use App\Exports\SeniorReport;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Str;
use Maatwebsite\Excel\Facades\Excel;

class GenerateReportJob implements ShouldQueue
{
    use Queueable, InteractsWithQueue, SerializesModels;

    public function __construct(
        public ?int $year = null,
        public ?string $barangay = null,
        public int $userId = 0,
        public ?int $minAge = null,
        public ?int $maxAge = null,
        public ?string $category = null,
        public ?string $search = null,
        public ?string $status = null,
        public ?string $sortBy = null,
        public ?string $sortOrder = null,
        public bool $filtered = false
    ) {}

    public function handle(): void
    {
        $label = $this->barangay ?? 'All_Barangays';
        $yearLabel = $this->year ?? 'AllTime';
        $filename = 'Senior_Citizens_Report_' . Str::slug($label, '_') . "_{$yearLabel}_" . time() . ".xlsx";
        $export = new SeniorReport(
            $this->year,
            $this->barangay,
            'Municipality of Pagsanjan, Province of Laguna',
            'Office of Senior Citizens Affairs (OSCA)',
            $this->minAge,
            $this->maxAge,
            $this->category,
            $this->search,
            $this->status,
            $this->sortBy,
            $this->sortOrder,
            $this->filtered
        );
        Excel::store($export, 'reports/' . $filename, 'local');
    }
}
