# Start OSCA Multi-Process Server (Nginx + PHP FastCGI Pool + MySQL)
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Resolve-Path "$ScriptDir\..\..\.."
$NginxExe = "C:\nginx\nginx.exe"
$NginxConf = "$ScriptDir\nginx.conf"
$PhpCgiExe = "C:\xampp\php\php-cgi.exe"
$MysqlExe = "C:\xampp\mysql\bin\mysqld.exe"
$MysqlIni = "C:\xampp\mysql\bin\my.ini"
$PhpCliExe = "C:\xampp\php\php.exe"
$Artisan = "$ProjectRoot\backend\artisan"

Write-Host ">>> Starting OSCA Production Server Stack..." -ForegroundColor Cyan

# 1. Start MySQL if not running
$mysqlPortOpen = $false
try {
    $conn = New-Object System.Net.Sockets.TcpClient("127.0.0.1", 3306)
    $mysqlPortOpen = $true
    $conn.Close()
} catch {}

if (-not $mysqlPortOpen) {
    Write-Host "  [+] Starting MySQL Database Service..." -ForegroundColor Yellow
    if (Test-Path $MysqlExe) {
        Start-Process $MysqlExe -ArgumentList "--defaults-file=$MysqlIni --standalone" -WindowStyle Hidden
        Start-Sleep -Seconds 2
    }
} else {
    Write-Host "  [OK] MySQL Database is already active." -ForegroundColor Green
}

# 2. Start PHP FastCGI Workers Pool (Ports 9000 to 9007)
# 8 workers: each open realtime SSE stream pins one worker for up to
# realtime.max_duration_seconds, so 4 are no longer enough once browsers
# hold streams open. ~40 MB RAM per worker is fine on this host.
$workerPorts = @(9000, 9001, 9002, 9003, 9004, 9005, 9006, 9007)
Write-Host "  [+] Verifying PHP FastCGI worker pool (Ports 9000-9007)..." -ForegroundColor Yellow

Get-Process php-cgi -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Milliseconds 300
$startup = ([wmiclass]"Win32_ProcessStartup").CreateInstance()
$startup.ShowWindow = 0
# -d flags override XAMPP php.ini so the 100 MB backup upload path works
# without editing global PHP settings (upload/post/timeout/memory).
# OPcache is enabled here too (XAMPP ships it commented out): without it
# every request recompiles all of Laravel. Timestamps stay validated so
# code deploys take effect without a worker restart (<=2 s delay).
$phpIniOverrides = "-d upload_max_filesize=150M -d post_max_size=160M -d max_execution_time=300 -d max_input_time=300 -d memory_limit=512M -d zend_extension=C:\xampp\php\ext\php_opcache.dll -d opcache.enable=1 -d opcache.memory_consumption=128 -d opcache.max_accelerated_files=10000 -d opcache.validate_timestamps=1 -d opcache.revalidate_freq=2"
foreach ($port in $workerPorts) {
    $cmd = "`"$PhpCgiExe`" -b 127.0.0.1:$port $phpIniOverrides"
    ([wmiclass]"Win32_Process").Create($cmd, $null, $startup) | Out-Null
}
Write-Host "  [OK] PHP FastCGI pool active (8 concurrent workers, hidden)." -ForegroundColor Green

# 3. Start Laravel Background Queue Worker
Write-Host "  [+] Verifying Laravel Background Queue Worker..." -ForegroundColor Yellow
Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like "*artisan*queue:work*" } | ForEach-Object {
    Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue
}
# --memory/--max-time recycle the worker so a slow leak can't eat the 8 GB box.
$queueCmd = "`"$PhpCliExe`" `"$Artisan`" queue:work --sleep=3 --tries=3 --timeout=300 --memory=256 --max-time=3600"
([wmiclass]"Win32_Process").Create($queueCmd, "$ProjectRoot\backend", $startup) | Out-Null
Write-Host "  [OK] Laravel Queue Worker active (hidden, background)." -ForegroundColor Green

# 3b. Start Laravel Scheduler (runs seniors:update-birthday-ages daily + any future schedule)
Write-Host "  [+] Verifying Laravel Scheduler..." -ForegroundColor Yellow
Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like "*artisan*schedule:work*" } | ForEach-Object {
    Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue
}
$scheduleCmd = "`"$PhpCliExe`" `"$Artisan`" schedule:work"
([wmiclass]"Win32_Process").Create($scheduleCmd, "$ProjectRoot\backend", $startup) | Out-Null
Write-Host "  [OK] Laravel Scheduler active (hidden, background)." -ForegroundColor Green

# 4. Deploy/Sync Nginx config files
Copy-Item "$ScriptDir\nginx.conf" "C:\nginx\conf\nginx.conf" -Force
Copy-Item "$ScriptDir\fastcgi_params" "C:\nginx\conf\fastcgi_params" -Force

# 5. Start Nginx
$nginxRunning = (Get-Process nginx -ErrorAction SilentlyContinue).Count -gt 0
if (-not $nginxRunning) {
    Write-Host "  [+] Launching Nginx Web Server on port 8000..." -ForegroundColor Yellow
    ([wmiclass]'Win32_Process').Create('C:\nginx\nginx.exe -p C:\nginx', 'C:\nginx', $startup) | Out-Null
    Start-Sleep -Seconds 1
} else {
    Write-Host "  [+] Reloading Nginx configuration..." -ForegroundColor Yellow
    $wsh = New-Object -ComObject WScript.Shell
    $wsh.Run("cmd /c cd /d C:\nginx && `"$NginxExe`" -s reload", 0, $false) | Out-Null
}

# 5. Verification Ping
Write-Host -NoNewline "  [+] Pinging Nginx OSCA Gateway " -ForegroundColor Yellow
$healthy = $false
for ($i = 0; $i -lt 15; $i++) {
    try {
        $res = Invoke-WebRequest -Uri "http://127.0.0.1:8000/api/seniors/next-id" -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
        if ($res.StatusCode -eq 200) {
            $healthy = $true
            break
        }
    } catch {}
    Write-Host -NoNewline "." -ForegroundColor Yellow
    Start-Sleep -Seconds 1
}

if ($healthy) {
    Write-Host " [ONLINE]" -ForegroundColor Green
    Write-Host "  [OK] Nginx is serving OSCA at http://localhost:8000" -ForegroundColor Green
    Write-Host ">>> Multi-threaded OSCA Server is ready for local and Cloudflare traffic!" -ForegroundColor Cyan
} else {
    Write-Host " [WARNING: Check logs if service does not respond]" -ForegroundColor Yellow
}
