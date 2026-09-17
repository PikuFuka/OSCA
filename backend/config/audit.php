<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Audit Log Retention
    |--------------------------------------------------------------------------
    |
    | Activity logs older than this many days are pruned when the log viewer
    | is opened. The README's audit-trail claim is only honest if this stays
    | generous: the default keeps 90 days. Set to 0 to disable auto-pruning
    | entirely (the table is tiny rows; growth is slow). Admins can still
    | clear logs manually, which always leaves a CLEARED_LOGS tombstone.
    |
    */

    'retention_days' => (int) env('AUDIT_LOG_RETENTION_DAYS', 90),

];
