@echo off

:: ────────── Force directory to script's location ──────────
pushd "%~dp0"

:: ────────── Auto-Elevate to Administrator ──────────
net session >nul 2>&1
if %errorlevel% NEQ 0 (
    echo Requesting Administrator access...
    powershell -Command "Start-Process '%~f0' -Verb runAs -WorkingDirectory '%~dp0'"
    exit /b
)

setlocal enabledelayedexpansion
:: ────────── Setup Colors ──────────
for /f %%a in ('echo prompt $E ^| cmd') do set "ESC=%%a"
set "RESET=%ESC%[0m"
set "GOLDCOLOR=%ESC%[1;38;5;220m"
set "REDCOLOR=%ESC%[1;38;5;196m"
set "BLUECOLOR=%ESC%[1;38;5;75m"
set "GREENCOLOR=%ESC%[1;38;5;46m"
set "ORANGECOLOR=%ESC%[1;38;5;208m"

:: ────────── Check for node in system PATH ──────────
where node >nul 2>&1
if %errorlevel%==0 (
    echo %GREENCOLOR%[SUCCESS]%RESET% Node.js found in system PATH.
    echo %BLUECOLOR%[INFO]%RESET% Starting server with npm start...
    echo.
    echo %BLUECOLOR%[INFO]%RESET% To stop the server, press CTRL+C or close this terminal window.
    npm start
    endlocal
    exit /b
)

:: ────────── If Node.js not found in system PATH, read nodePath from config.json ──────────
set "CONFIG_FILE=%~dp0config.json"
set "NODE_PATH="

:: ────────── Ensure config.json exists ──────────
if not exist "%CONFIG_FILE%" (
    echo %REDCOLOR%[ERROR]%RESET% config.json not found in %CONFIG_FILE%
    pause
    exit /b
)

:: ────────── Read nodePath via PowerShell JSON parser ──────────
for /f "usebackq delims=" %%P in (`
    powershell -NoProfile -Command ^
      "(Get-Content '%~dp0config.json' -Raw | ConvertFrom-Json).nodePath"
`) do set "NODE_PATH=%%P"

:: ────────── Validate node.exe path ──────────
if not exist "%NODE_PATH%" (
    echo %REDCOLOR%[ERROR]%RESET% Node.js not found at:
    echo %REDCOLOR%[ERROR]%RESET% %NODE_PATH%
    echo %REDCOLOR%[ERROR]%RESET% Please correct config.json or install Node.js.
    pause
    exit /b
)

:: ────────── Add node folder to PATH (fallback) ──────────
for %%I in ("!NODE_PATH!") do set "NODE_DIR=%%~dpI"
set "PATH=%NODE_DIR%;%PATH%"

echo %GOLDCOLOR%[FALLBACK]%RESET% Node.js not found in PATH, using fallback from config.json:
echo %BLUECOLOR%[INFO]%RESET% %NODE_PATH%
echo %BLUECOLOR%[INFO]%RESET% Starting server with npm start...
echo.
echo %BLUECOLOR%[INFO]%RESET% To stop the server, press CTRL+C or close this terminal window.

npm start

endlocal
exit /b