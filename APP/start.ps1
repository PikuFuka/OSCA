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
$ShortcutPath = Join-Path $env:USERPROFILE "Desktop\OSCA.lnk"

# 1. Desktop Shortcut Check
Write-Host -NoNewline "  [$gear] Verifying desktop environment shortcut ... " -ForegroundColor Gray
if (-not (Test-Path $ShortcutPath)) {
    try {
        $WshShell = New-Object -ComObject WScript.Shell
        $Shortcut = $WshShell.CreateShortcut($ShortcutPath)
        $Shortcut.TargetPath = Join-Path $ScriptDir "start.bat"
        $Shortcut.IconLocation = $IconPath
        $Shortcut.WorkingDirectory = $ScriptDir
        $Shortcut.Save()
        Write-Host "[CREATED]" -ForegroundColor Green
    } catch {
        Write-Host "[FAILED]" -ForegroundColor Red
    }
} else {
    Write-Host "[EXISTS]" -ForegroundColor Gray
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

# 3. Launching background dev servers
Write-Host -NoNewline "  [$gear] Initializing development servers ...... " -ForegroundColor Gray
try {
    Start-Process cmd -ArgumentList "/c npm run dev" -WindowStyle Minimized
    Write-Host "[LAUNCHED]" -ForegroundColor Green
} catch {
    Write-Host "[FAILED]" -ForegroundColor Red
}

# 4. Database backend connection polling
Write-Host -NoNewline "  [$gear] Pinging database backend proxy " -ForegroundColor Gray
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
Write-Host "   $check  All services started successfully!" -ForegroundColor Green
Write-Host "   $lightning  Redirecting to http://localhost:3000" -ForegroundColor Cyan
Write-Host "  $line" -ForegroundColor Gray
Write-Host ""

# Automatically open the website
Start-Process "http://localhost:3000"

# Wait a brief moment before exiting
Start-Sleep -Seconds 2
