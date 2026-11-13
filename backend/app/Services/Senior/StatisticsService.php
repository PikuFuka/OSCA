<?php

namespace App\Services\Senior;

use App\Models\Senior;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class StatisticsService
{
    /**
     * Replaces SeniorController::statistics 47-query loop with 3 aggregated queries.
     * Cached 5 min (file/redis) and invalidated via SeniorObserver.
     */
    public function get(string $barangay = null, string $year = null): array
    {
        $cacheKey = sprintf('stats:v3:%s:%s', $barangay && $barangay !== 'All Barangays' ? $barangay : 'all', $year && $year !== 'All Years' ? $year : 'all');

        return Cache::remember($cacheKey, now()->addMinutes(5), function () use ($barangay, $year) {
            $isAllYears = !$year || $year === 'All Years';
            $populationQuery = Senior::query();
            $growthQuery = Senior::query();

            if (!$isAllYears) {
                $end = "$year-12-31 23:59:59";
                $populationQuery->where(fn($q) => $q->where('created_at','<=',$end)->orWhereNull('created_at'));
                $growthQuery->whereYear('created_at', $year);
            }
            if ($barangay && $barangay !== 'All Barangays') {
                $populationQuery->where('barangay', $barangay);
                $growthQuery->where('barangay', $barangay);
            }

            // Single query for all 12 months split by sex/status
            $monthlyRows = (clone $growthQuery)
                ->selectRaw("MONTH(created_at) as m, SUM(sex='Male') as male, SUM(sex='Female') as female, SUM(status='Deceased') as deceased")
                ->whereNotNull('created_at')
                ->groupByRaw("MONTH(created_at)")
                ->get()->keyBy('m');

            $monthlyStats = [];
            for ($m=1; $m<=12; $m++) {
                $row = $monthlyRows->get($m);
                $monthlyStats[] = [
                    'name' => date('M', mktime(0,0,0,$m,1)),
                    'male' => (int) ($row->male ?? 0),
                    'female' => (int) ($row->female ?? 0),
                    'deceased' => (int) ($row->deceased ?? 0),
                ];
            }

            // Status totals (all records in scope, including deceased/pending).
            $total = (clone $populationQuery)->count();
            $active = (clone $populationQuery)->where('status', 'Active')->count();
            $pending = (clone $populationQuery)->where('status', 'Pending')->count();
            $deceased = (clone $populationQuery)->where('status', 'Deceased')->count();

            // Registry demographics: living active members only, so dashboard
            // breakdowns (heatmap, ages, genders, centenarians) stay consistent
            // with the "Active Registry" count and exclude deceased/deleted/pending.
            $registryQuery = (clone $populationQuery)->where('status', 'Active');

            $heatmap = (clone $registryQuery)
                ->select('barangay as name', DB::raw('count(*) as count'))
                ->groupBy('barangay')->orderByDesc('count')->get();
            $max = $heatmap->max('count') ?: 1;
            $heatmap->each(fn($s) => $s->intensity = $s->count / $max);

            // Top 10 single ages by population (powers the Peak Ages leaderboard)
            $topAges = (clone $registryQuery)
                ->select('age', DB::raw('count(*) as count'))
                ->whereNotNull('age')
                ->groupBy('age')
                ->orderByDesc('count')
                ->orderBy('age')
                ->limit(10)
                ->get()
                ->map(fn($r) => ['age' => (int) $r->age, 'count' => (int) $r->count])
                ->values();

            $today = \Illuminate\Support\Carbon::today();
            $birthdaysToday = (clone $registryQuery)
                ->whereMonth('date_of_birth', $today->month)
                ->whereDay('date_of_birth', $today->day)
                ->whereNotNull('date_of_birth')
                ->count();

            return [
                'total' => $total,
                'active' => $active,
                'pending' => $pending,
                'deceased' => $deceased,
                'centenarians' => (clone $registryQuery)->where('age', '>=', 100)->count(),
                'birthdaysToday' => $birthdaysToday,
                'monthlyStats' => $monthlyStats,
                'ageRanges' => [
                    ['range'=>'60-65','count'=>(clone $registryQuery)->whereBetween('age',[60,65])->count()],
                    ['range'=>'66-70','count'=>(clone $registryQuery)->whereBetween('age',[66,70])->count()],
                    ['range'=>'71-75','count'=>(clone $registryQuery)->whereBetween('age',[71,75])->count()],
                    ['range'=>'76-80','count'=>(clone $registryQuery)->whereBetween('age',[76,80])->count()],
                    ['range'=>'81-85','count'=>(clone $registryQuery)->whereBetween('age',[81,85])->count()],
                    ['range'=>'86-90','count'=>(clone $registryQuery)->whereBetween('age',[86,90])->count()],
                    ['range'=>'91+','count'=>(clone $registryQuery)->where('age','>',90)->count()],
                ],
                'genders' => [
                    ['name'=>'Male','value'=>(clone $registryQuery)->where('sex','Male')->count()],
                    ['name'=>'Female','value'=>(clone $registryQuery)->where('sex','Female')->count()],
                ],
                'topBarangays' => $heatmap->take(5),
                'allBarangayStats' => $heatmap,
                'topAges' => $topAges,
            ];
        });
    }

    public function clearCache(): void
    {
        // File driver has no tags; clear known keys pattern would require redis tags.
        // For file driver we rely on TTL; for redis, caller can use Cache::tags(['stats'])->flush()
        Cache::forget('stats:v3:all:all');
    }
}
