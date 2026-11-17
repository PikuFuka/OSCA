<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\OscaIdVacancy;
use Illuminate\Http\Request;

class OscaIdVacancyController extends Controller
{
    public function index(Request $request)
    {
        $query = OscaIdVacancy::query()
            ->orderByDesc('vacated_at')
            ->orderBy('osca_id');

        $search = trim((string) $request->get('search', ''));

        if ($search !== '') {
            $query->where(function ($query) use ($search) {
                $query->where('osca_id', 'like', "%{$search}%")
                    ->orWhere('past_holder_name', 'like', "%{$search}%");
            });
        }

        $vacancies = $query->get();

        return response()->json([
            'data' => $vacancies->map(fn (OscaIdVacancy $vacancy) => [
                'id' => $vacancy->id,
                'oscaId' => $vacancy->osca_id,
                'reason' => $vacancy->reason,
                'pastHolder' => $vacancy->past_holder_name,
                'vacatedAt' => $vacancy->vacated_at?->format('Y-m-d'),
            ])->values(),
            'total' => $vacancies->count(),
        ]);
    }
}
