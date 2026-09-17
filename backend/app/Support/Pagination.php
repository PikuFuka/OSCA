<?php

namespace App\Support;

use Illuminate\Http\Request;

/**
 * Single place that clamps client-controlled page sizes.
 * Unbounded per_page is a memory bomb (full-table Eloquent hydration).
 */
class Pagination
{
    public static function perPage(Request $request, int $default = 50, int $max = 100): int
    {
        return max(1, min($max, (int) $request->get('per_page', $default)));
    }
}
