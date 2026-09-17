<?php

namespace App\Support;

use App\Models\ActivityLog;

/**
 * Audit-log retention pruning.
 *
 * Runs as a DAILY SCHEDULED job (see routes/console.php) — never on the
 * read path. Pruning inside the log viewer meant every admin click paid
 * for a bulk DELETE that blocked its own SELECT.
 */
class AuditRetention
{
    /** Delete rows older than the configured window. Returns rows removed. */
    public static function prune(): int
    {
        $retentionDays = (int) config('audit.retention_days', 90);
        if ($retentionDays <= 0) {
            return 0;
        }

        return ActivityLog::where('created_at', '<', now()->subDays($retentionDays))->delete();
    }
}
