<?php

/*
 * Test bootstrap.
 *
 * Two host-specific gotchas make phpunit.xml <env> entries unreliable here:
 *  1. XAMPP's php.ini sets variables_order=GPCS, so $_ENV is never populated
 *     and PHPUnit <env> values never reach Laravel's environment reader.
 *  2. backend/bootstrap/cache/config.php holds the PRODUCTION config cache;
 *     if loaded during tests, phpunit.xml DB overrides (sqlite :memory:) are
 *     silently ignored and tests would run against MySQL.
 *
 * This file sets the test environment explicitly via superglobals (immune to
 * variables_order) and redirects the config/route cache paths to temp files
 * that never exist, so tests always boot fresh testing configuration while
 * the production cache file on disk is left untouched.
 */

$testEnv = [
    'APP_ENV' => 'testing',
    'APP_MAINTENANCE_DRIVER' => 'file',
    'BCRYPT_ROUNDS' => '4',
    'BROADCAST_CONNECTION' => 'null',
    'CACHE_STORE' => 'array',
    'DB_CONNECTION' => 'sqlite',
    'DB_DATABASE' => ':memory:',
    'MAIL_MAILER' => 'array',
    'QUEUE_CONNECTION' => 'sync',
    'SESSION_DRIVER' => 'array',
    'PULSE_ENABLED' => 'false',
    'TELESCOPE_ENABLED' => 'false',
    'NIGHTWATCH_ENABLED' => 'false',
    // Test-only signing key (see phpunit.xml). Never use outside the suite.
    'APP_KEY' => 'base64:ekpSkLMsjy228k1WyZJl7O35V/WPCNiB3bHixVATkJs=',
];

foreach ($testEnv as $key => $value) {
    $_SERVER[$key] = $value;
    $_ENV[$key] = $value;
    putenv($key . '=' . $value);
}

// Point Laravel at cache files that do not exist so the production
// bootstrap/cache/config.php is never loaded inside the test process.
$nullCache = sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'osca-phpunit-no-cache.php';
@unlink($nullCache);
$_SERVER['APP_CONFIG_CACHE'] = $nullCache;
$_ENV['APP_CONFIG_CACHE'] = $nullCache;
putenv('APP_CONFIG_CACHE=' . $nullCache);

$_SERVER['APP_ROUTES_CACHE'] = $nullCache;
$_ENV['APP_ROUTES_CACHE'] = $nullCache;
putenv('APP_ROUTES_CACHE=' . $nullCache);

require dirname(__DIR__) . '/vendor/autoload.php';
