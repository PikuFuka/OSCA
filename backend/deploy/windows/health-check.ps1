# OSCA health check — exit 0 when the stack answers, 1 otherwise.
# Used by the "OSCA Health Check" scheduled task (see Install-OscaStartup.ps1)
# and by operators after restarts. Checks: nginx port, Laravel /up, API route.
[CmdletBinding()]
param(
    [string]$BaseUrl = "http://127.0.0.1:8000"
)

$failures = @()

function Test-Endpoint([string]$url, [string]$name) {
    try {
        $res = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
        if ($res.StatusCode -ge 200 -and $res.StatusCode -lt 500) {
            Write-Host "  [OK] $name ($($res.StatusCode))" -ForegroundColor Green
            return $true
        }
        Write-Host "  [FAIL] $name returned $($res.StatusCode)" -ForegroundColor Red
        return $false
    } catch {
        Write-Host "  [FAIL] $name unreachable: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

if (-not (Test-Endpoint "$BaseUrl/up" "Laravel health (/up)")) { $failures += "/up" }
if (-not (Test-Endpoint "$BaseUrl/api/seniors/next-id" "API route")) { $failures += "api" }

foreach ($port in @(3306, 9000, 9001, 9002, 9003)) {
    try {
        $conn = New-Object System.Net.Sockets.TcpClient("127.0.0.1", $port)
        $conn.Close()
        Write-Host "  [OK] TCP 127.0.0.1:$port" -ForegroundColor Green
    } catch {
        Write-Host "  [FAIL] TCP 127.0.0.1:$port closed" -ForegroundColor Red
        $failures += "tcp:$port"
    }
}

if ($failures.Count -gt 0) {
    Write-Host "UNHEALTHY: $($failures -join ', ')" -ForegroundColor Red
    exit 1
}
Write-Host "HEALTHY" -ForegroundColor Green
exit 0
