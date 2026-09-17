# Stop OSCA Server (Nginx and PHP FastCGI Pool)
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$NginxExe = "C:\nginx\nginx.exe"

Write-Host ">>> Stopping OSCA Server Stack..." -ForegroundColor Cyan

# 1. Stop Nginx
if (Test-Path $NginxExe) {
    try {
        Start-Process $NginxExe -ArgumentList "-p C:\nginx -s stop" -Wait -WindowStyle Hidden -ErrorAction SilentlyContinue
    } catch {}
}
Get-Process nginx -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Write-Host "  [OK] Nginx stopped." -ForegroundColor Green

# 2. Stop PHP-CGI workers
Get-Process php-cgi -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Write-Host "  [OK] PHP FastCGI workers stopped." -ForegroundColor Green

# 3. Stop Laravel Queue Worker
Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like "*artisan*queue:work*" } | ForEach-Object {
    Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue
}
Write-Host "  [OK] Laravel Queue Worker stopped." -ForegroundColor Green

# 3b. Stop Laravel Scheduler
Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like "*artisan*schedule:work*" } | ForEach-Object {
    Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue
}
Write-Host "  [OK] Laravel Scheduler stopped." -ForegroundColor Green

Write-Host ">>> All OSCA web services stopped cleanly." -ForegroundColor Cyan
