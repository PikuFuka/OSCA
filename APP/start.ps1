# Set console output encoding to UTF-8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

# Clear the screen
Clear-Host

# Define Unicode icons dynamically using code points to prevent file encoding errors
$rocket = [char]::ConvertFromUtf32(0x1F680)
$gear = [char]0x2699
$check = [char]0x2714
$lightning = [char]0x26A1
$cross = [char]0x2718
$line = [string]([char]0x2500) * 53

# Print OSCA logo in bright blue
Write-Host ""
Write-Host "  ____   ____   ____    _    " -ForegroundColor Blue
Write-Host " / __ \ / ___| / ___|  / \   " -ForegroundColor Blue
Write-Host "| |  | |\___ \| |     / _ \  " -ForegroundColor Blue
Write-Host "| |  | | ___) | |___ / ___ \ " -ForegroundColor Blue
Write-Host " \____/ |____/ \____/_/   \_\ " -ForegroundColor Blue
Write-Host ""
Write-Host "  $line" -ForegroundColor Gray
Write-Host "   $rocket  Starting OSCA Core Application Services" -ForegroundColor Cyan
Write-Host "  $line" -ForegroundColor Gray
Write-Host ""

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Resolve-Path "$ScriptDir\.."
$IconPath = Join-Path $ScriptDir "osca_logo.ico"
$DesktopShortcut = Join-Path $env:USERPROFILE "Desktop\OSCA.lnk"
$ProjectsShortcut = Join-Path $env:USERPROFILE "Desktop\PROJECTS\OSCA.lnk"

# 1. Desktop Shortcut Check
Write-Host -NoNewline "  [$gear] Verifying desktop environment shortcut ... " -ForegroundColor Gray
try {
    $WshShell = New-Object -ComObject WScript.Shell
    foreach ($scPath in @($DesktopShortcut, $ProjectsShortcut)) {
        $parentDir = Split-Path -Parent $scPath
        if (Test-Path $parentDir) {
            $Shortcut = $WshShell.CreateShortcut($scPath)
            $Shortcut.TargetPath = Join-Path $ScriptDir "start.bat"
            $Shortcut.IconLocation = $IconPath
            $Shortcut.WorkingDirectory = $ScriptDir
            $Shortcut.Save()
        }
    }
    Write-Host "[READY]" -ForegroundColor Green
} catch {
    Write-Host "[FAILED]" -ForegroundColor Red
}

# Move to project root
Set-Location $ProjectRoot

# 2. Node Modules Check
Write-Host -NoNewline "  [$gear] Verifying project dependencies ......... " -ForegroundColor Gray
$NodeModules = Join-Path $ProjectRoot "node_modules"
if (-not (Test-Path $NodeModules)) {
    Write-Host "[MISSING]" -ForegroundColor Yellow
    Write-Host -NoNewline "  [$gear] Installing required dependencies ....... " -ForegroundColor Gray
    Start-Process npm -ArgumentList "install --quiet" -NoNewWindow -Wait
    Write-Host "[INSTALLED]" -ForegroundColor Green
} else {
    Write-Host "[READY]" -ForegroundColor Green
}

# 3. Launching background multi-process server (Nginx + PHP FastCGI + MySQL)
Write-Host -NoNewline "  [$gear] Initializing multi-process Nginx stack ... " -ForegroundColor Gray
try {
    $NginxStartScript = Join-Path $ProjectRoot "backend\deploy\nginx\start-server.ps1"
    & $NginxStartScript | Out-Null
    Write-Host "[LAUNCHED]" -ForegroundColor Green
} catch {
    Write-Host "[FAILED]" -ForegroundColor Red
}

# 4. Database backend connection polling
Write-Host -NoNewline "  [$gear] Pinging Nginx OSCA Gateway " -ForegroundColor Gray
$connected = $false
$url = "http://127.0.0.1:8000/api/seniors/next-id"
for ($i = 0; $i -lt 30; $i++) {
    try {
        $response = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 1 -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            $connected = $true
            break
        }
    } catch {
        # Silent retry
    }
    Write-Host -NoNewline "." -ForegroundColor Yellow
    Start-Sleep -Seconds 1
}

if ($connected) {
    Write-Host " [CONNECTED]" -ForegroundColor Green
} else {
    Write-Host " [TIMEOUT]" -ForegroundColor Red
}

Write-Host ""
Write-Host "  $line" -ForegroundColor Gray
Write-Host "   $check  Multi-process OSCA Server is active!" -ForegroundColor Green
Write-Host "   $lightning  Access URL: http://localhost:8000/app" -ForegroundColor Cyan
Write-Host "   [i] Live event monitor running. Do NOT close this window to keep server alive." -ForegroundColor Yellow
Write-Host "   [x] Press Ctrl+C in this window to stop all services." -ForegroundColor DarkGray
Write-Host "  $line" -ForegroundColor Gray
Write-Host ""

# Automatically open the website
Start-Process "http://localhost:8000/app"

# Ensure access log exists
$AccessLog = "C:\nginx\logs\access.log"
if (-not (Test-Path $AccessLog)) {
    New-Item -ItemType File -Path $AccessLog -Force | Out-Null
}

Write-Host "  [LIVE EVENT STREAM]" -ForegroundColor Gray
Write-Host "  $line" -ForegroundColor DarkGray

try {
    # Keep window open and stream live events continuously
    Get-Content -Path $AccessLog -Wait -Tail 0 | ForEach-Object {
        $logLine = $_
        if ($logLine -and $logLine.Contains('"')) {
            $parts = $logLine.Split('"')
            if ($parts.Count -ge 3) {
                $reqElements = $parts[1].Trim().Split(' ')
                $statusElements = $parts[2].Trim().Split(' ')
                if ($reqElements.Count -ge 2 -and $statusElements.Count -ge 1) {
                    $method = $reqElements[0]
                    $path = $reqElements[1]
                    $status = $statusElements[0]
                    $now = (Get-Date).ToString("HH:mm:ss")

                    $statusColor = "Green"
                    $statusCode = 0
                    [int]::TryParse($status, [ref]$statusCode) | Out-Null
                    if ($statusCode -ge 400 -and $statusCode -lt 500) { $statusColor = "Yellow" }
                    elseif ($statusCode -ge 500) { $statusColor = "Red" }

                    Write-Host "  [$now] " -ForegroundColor DarkGray -NoNewline
                    Write-Host "$($status.PadRight(4))" -ForegroundColor $statusColor -NoNewline
                    Write-Host "$($method.PadRight(7))" -ForegroundColor Cyan -NoNewline
                    Write-Host "$path" -ForegroundColor White
                }
            }
        }
    }
} finally {
    Write-Host "`n>>> Stopping OSCA Server Stack..." -ForegroundColor Yellow
    $StopScript = Join-Path $ProjectRoot "backend\deploy\nginx\stop-server.ps1"
    if (Test-Path $StopScript) {
        & $StopScript | Out-Null
    }
    Write-Host ">>> All OSCA services stopped cleanly." -ForegroundColor Gray
}
