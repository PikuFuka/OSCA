<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    */

    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],

    // Local dev origins plus production domains from CORS_ALLOWED_ORIGINS
    // (comma/space separated, e.g. https://osca.example.gov.ph). Rebuild the
    // config cache after changing .env: php artisan config:cache
    'allowed_origins' => array_values(array_unique(array_filter(array_merge(
        ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000', 'http://localhost:3001'],
        preg_split('/[\s,]+/', (string) env('CORS_ALLOWED_ORIGINS', ''), -1, PREG_SPLIT_NO_EMPTY) ?: []
    )))),

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],

    'exposed_headers' => [],

    'max_age' => 600,

    'supports_credentials' => true,

];
