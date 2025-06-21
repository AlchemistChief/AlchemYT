@echo off
:: ────────── Force directory to script's location ──────────
pushd "%~dp0"

:: ────────── Auto-Elevate to Administrator ──────────
net session >nul 2>&1
if %errorLevel% NEQ 0 (
    echo Requesting Administrator access...
    powershell -Command "Start-Process '%~f0' -Verb runAs -WorkingDirectory '%~dp0'"
    exit /b
)

:: ────────── Setup Colors ──────────
setlocal enabledelayedexpansion
for /f %%a in ('echo prompt $E ^| cmd') do set "ESC=%%a"
set "RESET=%ESC%[0m"
set "GOLDCOLOR=%ESC%[1;38;5;220m"
set "REDCOLOR=%ESC%[1;38;5;196m"
set "BLUECOLOR=%ESC%[1;38;5;75m"
set "GREENCOLOR=%ESC%[1;38;5;46m"

:: ────────── Read nodePath from config.json ──────────
set "CONFIG_FILE=%~dp0config.json"
set "NODE_PATH="

for /f "usebackq delims=" %%L in ("%CONFIG_FILE%") do (
    set "line=%%L"
    rem Check if line contains "nodePath"
    echo !line! | findstr /i "nodePath" >nul
    if !errorlevel! == 0 (
        rem Extract everything after first colon :
        for /f "tokens=1* delims=:" %%A in ("!line!") do (
            set "rawPath=%%B"
            rem Remove leading spaces and quotes
            set "rawPath=!rawPath:~1!"
            set "rawPath=!rawPath:"=!"
            rem Remove trailing commas and spaces
            setlocal enabledelayedexpansion
            for /f "tokens=* delims=, " %%P in ("!rawPath!") do (
                endlocal
                set "NODE_PATH=%%P"
            )
        )
    )
)

:: Validate Node.exe existence
if not exist "!NODE_PATH!" (
    echo !REDCOLOR![ERROR]!RESET! Node.js executable not found at path:
    echo    !NODE_PATH!
    echo !REDCOLOR![ERROR]!RESET! Please run Install.bat first to set up Node.js.
    pause
    exit /b 1
)

:: Add node folder to PATH
for %%I in ("!NODE_PATH!") do set "NODE_DIR=%%~dpI"
set "PATH=!NODE_DIR!;%PATH%"

echo !BLUECOLOR![INFO]!RESET! Using Node.js at: !NODE_PATH!
echo !BLUECOLOR![INFO]!RESET! Starting server with npm start...
echo.
echo !BLUECOLOR![INFO]!RESET! To stop the server, press CTRL+C or close this terminal window.

:: Use npm start to launch server (npm must be installed in your node path)
npm start

endlocal
