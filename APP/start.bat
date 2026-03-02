@echo off
SETLOCAL EnableExtensions

:: Set paths relative to script location
set "SCRIPT_PATH=%~f0"
set "SCRIPT_DIR=%~dp0"
set "ICON_PATH=%SCRIPT_DIR%osca_logo.ico"
set "SHORTCUT_PATH=%USERPROFILE%\Desktop\OSCA.lnk"

:: Create Desktop shortcut if it doesn't already exist
if not exist "%SHORTCUT_PATH%" (
    echo [INFO] Creating Desktop Shortcut for OSCA...
    powershell -NoProfile -Command ^
        "$ws = New-Object -ComObject WScript.Shell; " ^
        "$s = $ws.CreateShortcut('%SHORTCUT_PATH%'); " ^
        "$s.TargetPath = '%SCRIPT_PATH%'; " ^
        "$s.IconLocation = '%ICON_PATH%'; " ^
        "$s.WorkingDirectory = '%SCRIPT_DIR%'; " ^
        "$s.Save()"
    if errorlevel 1 (
        echo [ERROR] Failed to create shortcut.
    ) else (
        echo [SUCCESS] Shortcut created on Desktop.
    )
)

TITLE OSCA Startup Monitor

:: Move to the project root directory
cd /d "%SCRIPT_DIR%.."

:: Check if node_modules exist, if not install them silently
if not exist "node_modules\" (
    echo [INFO] First time setup: Installing dependencies...
    call npm install --quiet
)

:: Start the services in a minimized background window
echo [INFO] Launching OSCA Services...
start /min "OSCA Services" cmd /c "npm run dev"

echo [INFO] Waiting for database connection...
:CHECK_CONNECTION
:: Check backend connectivity (requires DB to be up) using curl (silent)
curl -s -f http://127.0.0.1:8000/api/seniors/next-id > nul

if errorlevel 1 (
    :: Silent wait for 2 seconds before retrying
    ping 127.0.0.1 -n 3 > nul
    goto CHECK_CONNECTION
)

echo [SUCCESS] Connected! Opening website...

:: Automatically open the website
start http://localhost:3000

:: Exit the terminal automatically
exit
