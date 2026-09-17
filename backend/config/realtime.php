<?php

return [

    // How often an open SSE stream re-checks the seniors table.
    'poll_seconds' => (int) env('REALTIME_POLL_SECONDS', 3),

    // Heartbeat comment interval to keep proxies/tunnels from idling out.
    'heartbeat_seconds' => (int) env('REALTIME_HEARTBEAT_SECONDS', 15),

    // Streams end themselves after this long; browsers reconnect
    // automatically (rotates php-cgi workers, drains cleanly on deploys).
    'max_duration_seconds' => (int) env('REALTIME_MAX_DURATION_SECONDS', 240),

    // Lifetime of the signed stream URL handed to the browser.
    'stream_ttl_minutes' => (int) env('REALTIME_STREAM_TTL_MINUTES', 30),

];
