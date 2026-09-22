# Set console output encoding to UTF-8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

# Clear the screen
Clear-Host

# Define Unicode icons dynamically using code points to prevent file encoding errors
$rocket = [char]::ConvertFromUtf32(0x1F680)
$globe = [char]::ConvertFromUtf32(0x1F310)
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

# 4b. Launch Cloudflare Quick Tunnel (non-fatal: a missing/dead tunnel must
# never block or stop the LAN stack - office machines go offline regularly).
$TunnelUrl = $null
$TunnelRegistered = $false
$CloudflaredExe = "C:\Program Files (x86)\cloudflared\cloudflared.exe"
if (-not (Test-Path $CloudflaredExe)) {
    $cfCmd = Get-Command cloudflared -ErrorAction SilentlyContinue
    if ($cfCmd) { $CloudflaredExe = $cfCmd.Source } else { $CloudflaredExe = $null }
}
$TunnelOutLog = Join-Path $env:TEMP "osca-cloudflared.out.log"
$TunnelErrLog = Join-Path $env:TEMP "osca-cloudflared.err.log"

Write-Host -NoNewline "  [$gear] Launching Cloudflare Quick Tunnel ......... " -ForegroundColor Gray
if ($CloudflaredExe) {
    try {
        # Clear any orphaned tunnel from a previous session that died without
        # running its cleanup (otherwise two tunnels would race for attention).
        Get-Process cloudflared -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
        Remove-Item $TunnelOutLog, $TunnelErrLog -Force -ErrorAction SilentlyContinue
        Start-Process -FilePath $CloudflaredExe `
            -ArgumentList @("tunnel", "--url", "http://127.0.0.1:8000") `
            -RedirectStandardOutput $TunnelOutLog `
            -RedirectStandardError $TunnelErrLog `
            -WindowStyle Hidden
        # cloudflared prints the public URL BEFORE the edge connection is
        # registered ("it may take some time to be reachable"). Wait for both
        # the URL line and a registered edge connection, up to 30s.
        for ($i = 0; $i -lt 30 -and -not ($TunnelUrl -and $TunnelRegistered); $i++) {
            Start-Sleep -Seconds 1
            Write-Host -NoNewline "." -ForegroundColor Yellow
            $logText = ""
            foreach ($logPath in @($TunnelErrLog, $TunnelOutLog)) {
                if (Test-Path $logPath) {
                    try { $logText += Get-Content $logPath -ErrorAction Stop | Out-String } catch {}
                }
            }
            if (-not $TunnelUrl -and $logText -match "https://[a-z0-9-]+\.trycloudflare\.com") {
                $TunnelUrl = $Matches[0]
            }
            if (-not $TunnelRegistered -and $logText -match "Registered tunnel connection") {
                $TunnelRegistered = $true
            }
        }
        # URL but never registered = edge connection failed -> drop to LAN only.
        if ($TunnelUrl -and -not $TunnelRegistered) {
            Get-Process cloudflared -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
            $TunnelUrl = $null
        }
    } catch {}
}
if ($TunnelUrl) {
    Write-Host "[ONLINE]" -ForegroundColor Green
} else {
    Write-Host "[LAN ONLY]" -ForegroundColor Yellow
}

# 4c. DNS sanity: browsers/curl resolve the tunnel hostname via the SYSTEM
# resolver, and some routers/ISPs NXDOMAIN *.trycloudflare.com (Cloudflare's
# own resolvers answer fine). The record also appears a few seconds AFTER
# registration - probe first. If it never resolves, install a scoped NRPT
# rule (one-time, admin-approved via UAC) that sends ONLY .trycloudflare.com
# queries to 1.1.1.1 - every other domain keeps using the normal resolver.
if ($TunnelUrl) {
    $tunnelHost = $TunnelUrl -replace '^https://', ''
    Write-Host -NoNewline "  [$gear] Verifying public DNS for the tunnel ....... " -ForegroundColor Gray
    $tunnelDnsOk = $false
    for ($i = 0; $i -lt 10; $i++) {
        try { Resolve-DnsName -Name $tunnelHost -Type A -ErrorAction Stop | Out-Null; $tunnelDnsOk = $true; break }
        catch { Write-Host -NoNewline "." -ForegroundColor Yellow; Start-Sleep -Seconds 3 }
    }
    if ($tunnelDnsOk) {
        Write-Host "[OK]" -ForegroundColor Green
    } else {
        Write-Host "[FILTERED]" -ForegroundColor Yellow
        $nrptPresent = $false
        try {
            $nrptPresent = [bool](Get-DnsClientNrptRule -ErrorAction Stop | Where-Object { ($_.Namespace -join ' ') -like '*trycloudflare*' })
        } catch {}
        if (-not $nrptPresent) {
            Write-Host "  [!] This network's DNS cannot resolve *.trycloudflare.com." -ForegroundColor Yellow
            Write-Host "      Approve the Windows prompt: a scoped rule will route ONLY" -ForegroundColor Yellow
            Write-Host "      .trycloudflare.com via 1.1.1.1 (other domains unchanged)." -ForegroundColor Yellow
            try {
                Start-Process powershell -Verb RunAs -Wait -ErrorAction Stop `
                    -ArgumentList '-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', "Add-DnsClientNrptRule -Namespace '.trycloudflare.com' -NameServers '1.1.1.1','1.0.0.1'"
                Clear-DnsClientCache -ErrorAction SilentlyContinue
                Start-Sleep -Seconds 3
                try { Resolve-DnsName -Name $tunnelHost -Type A -ErrorAction Stop | Out-Null; $tunnelDnsOk = $true } catch {}
            } catch {
                Write-Host "  [!] Prompt declined or failed - public URL will not open on this PC." -ForegroundColor Yellow
            }
        } else {
            # Rule exists (e.g. cached negative answer) - flush and retry once.
            Clear-DnsClientCache -ErrorAction SilentlyContinue
            Start-Sleep -Seconds 3
            try { Resolve-DnsName -Name $tunnelHost -Type A -ErrorAction Stop | Out-Null; $tunnelDnsOk = $true } catch {}
            if (-not $tunnelDnsOk) {
                Write-Host "  [!] DNS rule present but hostname still unresolved - check again in a minute." -ForegroundColor Yellow
            }
        }
        if ($tunnelDnsOk) {
            Write-Host "  [OK] Public DNS unblocked (scoped rule active)." -ForegroundColor Green
        }
    }
}

Write-Host ""
Write-Host "  $line" -ForegroundColor Gray
Write-Host "   $check  Multi-process OSCA Server is active!" -ForegroundColor Green
Write-Host "   $lightning  Access URL: http://localhost:8000/app" -ForegroundColor Cyan
if ($TunnelUrl) {
    Write-Host "   $globe  Public URL: $TunnelUrl" -ForegroundColor Cyan
    Write-Host "           (temporary address - changes every restart)" -ForegroundColor DarkGray
} else {
    Write-Host "   $cross  Cloudflare tunnel unavailable - LAN access only." -ForegroundColor Yellow
}
Write-Host "   [i] Live event monitor running. Do NOT close this window to keep server + tunnel alive." -ForegroundColor Yellow
Write-Host "   [x] Press Ctrl+C in this window to stop all services (stack + tunnel)." -ForegroundColor DarkGray
Write-Host "  $line" -ForegroundColor Gray
Write-Host ""

# Automatically open the website (prefer the public tunnel URL when up)
if ($TunnelUrl) {
    Start-Process $TunnelUrl
} else {
    Start-Process "http://localhost:8000/app"
}

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
    Write-Host "`n>>> Stopping Cloudflare tunnel + OSCA Server Stack..." -ForegroundColor Yellow
    Get-Process cloudflared -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
    $StopScript = Join-Path $ProjectRoot "backend\deploy\nginx\stop-server.ps1"
    if (Test-Path $StopScript) {
        & $StopScript | Out-Null
    }
    Write-Host ">>> All OSCA services stopped cleanly." -ForegroundColor Gray
}
