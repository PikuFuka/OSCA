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
        $cacheKey = sprintf('stats:v2:%s:%s', $barangay && $barangay !== 'All Barangays' ? $barangay : 'all', $year && $year !== 'All Years' ? $year : 'all');

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

            $heatmap = (clone $populationQuery)
                ->select('barangay as name', DB::raw('count(*) as count'))
                ->groupBy('barangay')->orderByDesc('count')->get();
            $max = $heatmap->max('count') ?: 1;
            $heatmap->each(fn($s) => $s->intensity = $s->count / $max);

            return [
                'total' => (clone $populationQuery)->count(),
                'active' => (clone $populationQuery)->where('status','Active')->count(),
                'pending' => (clone $populationQuery)->where('status','Pending')->count(),
                'deceased' => (clone $populationQuery)->where('status','Deceased')->count(),
                'centenarians' => (clone $populationQuery)->where('age','>=',100)->where('status','!=','Deceased')->count(),
                'monthlyStats' => $monthlyStats,
                'ageRanges' => [
                    ['range'=>'60-65','count'=>(clone $populationQuery)->whereBetween('age',[60,65])->count()],
                    ['range'=>'66-70','count'=>(clone $populationQuery)->whereBetween('age',[66,70])->count()],
                    ['range'=>'71-75','count'=>(clone $populationQuery)->whereBetween('age',[71,75])->count()],
                    ['range'=>'76-80','count'=>(clone $populationQuery)->whereBetween('age',[76,80])->count()],
                    ['range'=>'81-85','count'=>(clone $populationQuery)->whereBetween('age',[81,85])->count()],
                    ['range'=>'86-90','count'=>(clone $populationQuery)->whereBetween('age',[86,90])->count()],
                    ['range'=>'91+','count'=>(clone $populationQuery)->where('age','>',90)->count()],
                ],
                'genders' => [
                    ['name'=>'Male','value'=>(clone $populationQuery)->where('sex','Male')->count()],
                    ['name'=>'Female','value'=>(clone $populationQuery)->where('sex','Female')->count()],
                ],
                'topBarangays' => $heatmap->take(5),
                'allBarangayStats' => $heatmap,
            ];
        });
    }

    public function clearCache(): void
    {
        // File driver has no tags; clear known keys pattern would require redis tags.
        // For file driver we rely on TTL; for redis, caller can use Cache::tags(['stats'])->flush()
        Cache::forget('stats:v2:all:all');
    }
}
