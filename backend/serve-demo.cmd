@echo off
cd /d "%~dp0"
set APP_ENV=local
set DB_CONNECTION=mysql
set DB_DATABASE=osca_demo
set SESSION_COOKIE=osca_demo_session
set SANCTUM_STATEFUL_DOMAINS=localhost,localhost:8001,127.0.0.1,127.0.0.1:8001
php artisan serve --host=127.0.0.1 --port=8001
