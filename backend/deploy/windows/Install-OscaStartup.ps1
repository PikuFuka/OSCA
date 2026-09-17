# OSCA Windows resilience setup — run once from an ELEVATED PowerShell.
#
# What it creates (all visible in Task Scheduler, no silent changes):
#   1. "OSCA Server"        — starts the stack (nginx + PHP pool + MySQL +
#                              queue + scheduler) at user logon.
#   2. "OSCA Health Check"  — every 5 minutes pings the stack and restarts it
#                              via start-server.ps1 when unhealthy.
#
# Optional (explicit opt-in only):
#   -DisableSleep           — sets AC standby/hibernate timeouts to "never" so
#                             the laptop can serve overnight. Off by default.
#
# Cloudflare Tunnel itself is installed separately (see cloudflared-guide.md);
# `cloudflared service install` registers it as a real Windows service.

[CmdletBinding()]
param(
    [switch]$DisableSleep
)

if (-not ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Error "Please re-run this script from an elevated (Administrator) PowerShell."
    exit 1
}

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Resolve-Path "$ScriptDir\..\..\.."
$StartScript = "$ProjectRoot\backend\deploy\nginx\start-server.ps1"
$HealthScript = "$ScriptDir\health-check.ps1"

$ps = (Get-Command powershell.exe).Source

# 1. Logon task — boot the stack after sign-in (and after reboots).
$startAction = New-ScheduledTaskAction -Execute $ps -Argument "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$StartScript`""
$startTrigger = New-ScheduledTaskTrigger -AtLogOn
$startSettings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable
Register-ScheduledTask -TaskName "OSCA Server" -Action $startAction -Trigger $startTrigger -Settings $startSettings -Description "Start OSCA stack (nginx + PHP + MySQL + queue + scheduler)." -Force | Out-Null
Write-Host "[OK] Scheduled task 'OSCA Server' registered (AtLogOn)." -ForegroundColor Green

# 2. Health-check task — restart the stack when it stops answering.
$healthAction = New-ScheduledTaskAction -Execute $ps -Argument "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -Command `"& '$HealthScript'; if (`$LASTEXITCODE -ne 0) { & '$StartScript' }`""
$healthTrigger = New-ScheduledTaskTrigger -Once -At (Get-Date) -RepetitionInterval (New-TimeSpan -Minutes 5) -RepetitionDuration ([TimeSpan]::MaxValue)
$healthSettings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable
Register-ScheduledTask -TaskName "OSCA Health Check" -Action $healthAction -Trigger $healthTrigger -Settings $healthSettings -Description "Restart OSCA stack when health-check fails." -Force | Out-Null
Write-Host "[OK] Scheduled task 'OSCA Health Check' registered (every 5 min)." -ForegroundColor Green

# 3. Sleep policy — opt-in only.
if ($DisableSleep) {
    powercfg /change standby-timeout-ac 0
    powercfg /change hibernate-timeout-ac 0
    Write-Host "[OK] AC sleep/hibernate disabled (laptop stays awake on charger)." -ForegroundColor Green
} else {
    Write-Host "[INFO] Sleep policy untouched. Pass -DisableSleep to keep the laptop awake on AC power." -ForegroundColor Yellow
    Write-Host "       Without it, Windows sleep WILL take the public site offline." -ForegroundColor Yellow
}

Write-Host "Done. Verify with: Get-ScheduledTask -TaskName 'OSCA*'" -ForegroundColor Cyan
