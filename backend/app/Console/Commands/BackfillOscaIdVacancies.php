<?php

namespace App\Console\Commands;

use App\Models\OscaIdVacancy;
use App\Models\Senior;
use App\Services\Senior\OscaIdVacancyService;
use Illuminate\Console\Command;

class BackfillOscaIdVacancies extends Command
{
    protected $signature = 'osca-ids:backfill-vacancies';
    protected $description = 'Release OSCA IDs held by existing deceased and deleted seniors into the available-ID pool';

    public function handle(OscaIdVacancyService $vacancies): int
    {
        $released = 0;

        Senior::withTrashed()
            ->whereNotNull('osca_id')
            ->where(function ($query) {
                $query->where('status', 'Deceased')->orWhereNotNull('deleted_at');
            })
            ->select(['id', 'osca_id', 'first_name', 'middle_name', 'last_name', 'extension_name', 'status', 'deleted_at', 'updated_at'])
            ->chunkById(200, function ($seniors) use ($vacancies, &$released) {
                foreach ($seniors as $senior) {
                    $reason = $senior->deleted_at
                        ? OscaIdVacancy::REASON_DELETED
                        : OscaIdVacancy::REASON_DECEASED;

                    $vacatedAt = $senior->deleted_at ?? $senior->updated_at ?? now();

                    if ($vacancies->vacate($senior, $reason, $vacatedAt)) {
                        $released++;
                    }
                }
            });

        $this->info("Released {$released} OSCA ID(s) into the available-ID pool.");

        return self::SUCCESS;
    }
}
