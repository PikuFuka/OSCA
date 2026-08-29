<?php

namespace App\Repositories;

use App\Models\Senior;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Schema;

class SeniorRepository
{
    /**
     * Central place for query scopes so controllers stay thin.
     * Uses osca_id_trim virtual column when available for index use.
     */
    public function applyValidOscaScope(Builder $query): Builder
    {
        static $hasTrim = null;
        if ($hasTrim === null) {
            try { $hasTrim = Schema::hasColumn('seniors', 'osca_id_trim'); } catch (\Throwable $e) { $hasTrim = false; }
        }
        return $hasTrim
            ? $query->whereNotNull('osca_id_trim')->where('osca_id_trim', '<>', '')
            : $query->whereNotNull('osca_id')->whereRaw("TRIM(osca_id) <> ''");
    }

    public function hasFulltextIndex(): bool
    {
        static $hasFt = null;
        if ($hasFt !== null) return $hasFt;
        try {
            $hasFt = (bool) \Illuminate\Support\Facades\DB::selectOne(
                "SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'seniors' AND index_name = 'seniors_ft_name' LIMIT 1"
            );
        } catch (\Throwable $e) { $hasFt = false; }
        return $hasFt;
    }

    public function applySearch(Builder $query, string $search): Builder
    {
        $search = trim($search);
        if ($search === '') return $query;
        $terms = array_values(array_filter(preg_split('/\s+/', $search) ?: [], fn($t) => $t !== ''));
        if ($terms === []) return $query;

        $query->where(function ($q) use ($search, $terms) {
            $q->where('osca_id', 'like', "%{$search}%");
            if ($this->hasFulltextIndex() && count($terms) <= 5) {
                $boolean = trim(implode(' ', array_map(fn($t) => trim($b = preg_replace('/[^\p{L}\p{N}]/u', '', $t)) === '' || mb_strlen($b) < 2 ? '' : '+'.$b.'*', $terms)));
                if ($boolean !== '' && $boolean !== '+' && $boolean !== '+*') {
                    $q->orWhereRaw("MATCH(first_name, middle_name, last_name) AGAINST(? IN BOOLEAN MODE)", [$boolean]);
                    return;
                }
            }
            $q->orWhere(function ($nameQuery) use ($terms) {
                foreach ($terms as $term) {
                    $nameQuery->where(function ($tq) use ($term) {
                        $tq->where('first_name','like',"%{$term}%")
                           ->orWhere('middle_name','like',"%{$term}%")
                           ->orWhere('last_name','like',"%{$term}%")
                           ->orWhere('extension_name','like',"%{$term}%");
                    });
                }
            });
        });
        return $query;
    }

    public function baseSelect(): Builder
    {
        return Senior::query()->select([
            'id','osca_id','first_name','middle_name','last_name','extension_name',
            'date_of_birth','age','place_of_birth','sex','mothers_maiden_name',
            'pension_status','barangay','street_address','contact_number',
            'emergency_name','emergency_contact','rrn','national_id',
            'profile_photo_path','id_config','status','created_at','updated_at'
        ])->withCount('familyMembers');
    }
}
