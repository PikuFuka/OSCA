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

TITLE OSCA APP Starter
echo ============================================
echo      Starting OSCA Application Services      
echo ============================================

:: Move to the project root directory
cd /d "%SCRIPT_DIR%.."

:: Check if node_modules exist, if not install them
if not exist "node_modules\" (
    echo [INFO] node_modules not found. Installing dependencies...
    npm install
)

:: Run the dev script from the root package.json
npm run dev

pause
