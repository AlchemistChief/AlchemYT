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

:: ────────── Check for node in system PATH ──────────
where node >nul 2>&1
if %errorlevel%==0 (
    echo !GREENCOLOR![OK]!RESET! Node.js found in system PATH.
    echo !BLUECOLOR![INFO]!RESET! Starting server with npm start...
    echo.
    echo !BLUECOLOR![INFO]!RESET! To stop the server, press CTRL+C or close this terminal window.
    npm start
    endlocal
    exit /b
)

:: ────────── Read nodePath from config.json ──────────
set "CONFIG_FILE=%~dp0config.json"
set "NODE_PATH="

for /f "usebackq delims=" %%L in ("%CONFIG_FILE%") do (
    set "line=%%L"
    echo !line! | findstr /i "nodePath" >nul
    if !errorlevel! == 0 (
        for /f "tokens=1* delims=:" %%A in ("!line!") do (
            set "rawPath=%%B"
            set "rawPath=!rawPath:~1!"
            set "rawPath=!rawPath:"=!"
            setlocal enabledelayedexpansion
            for /f "tokens=* delims=, " %%P in ("!rawPath!") do (
                endlocal
                set "NODE_PATH=%%P"
            )
        )
    )
)

:: Validate node.exe from config
if not exist "!NODE_PATH!" (
    echo !REDCOLOR![ERROR]!RESET! Node.js not found in PATH or config.json.
    echo    !NODE_PATH!
    echo !REDCOLOR![ERROR]!RESET! Please run Install.bat or fix config.json path.
    pause
    exit /b 1
)

:: Add node folder to PATH (fallback method)
for %%I in ("!NODE_PATH!") do set "NODE_DIR=%%~dpI"
set "PATH=!NODE_DIR!;%PATH%"

echo !GOLDCOLOR![FALLBACK]!RESET! Node.js not found in PATH, using fallback from config.json:
echo    !NODE_PATH!
echo !BLUECOLOR![INFO]!RESET! Starting server with npm start...
echo.
echo !BLUECOLOR![INFO]!RESET! To stop the server, press CTRL+C or close this terminal window.

npm start

endlocal
