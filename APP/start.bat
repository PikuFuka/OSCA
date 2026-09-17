@echo off
title OSCA Multi-Process Server
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0start.ps1"
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] OSCA server process exited with error code %ERRORLEVEL%.
    pause
)
