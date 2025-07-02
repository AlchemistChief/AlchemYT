@echo off
setlocal enabledelayedexpansion

:: =======================================================================
:: Define ANSI escape sequences for colors
for /f %%a in ('echo prompt $E ^| cmd') do set "ESC=%%a"
set "RESET=%ESC%[0m"
set "GOLDCOLOR=%ESC%[1;38;5;220m"
set "REDCOLOR=%ESC%[1;38;5;196m"
set "BLUECOLOR=%ESC%[1;38;5;75m"
set "GREENCOLOR=%ESC%[1;38;5;46m"
:: =======================================================================

:: Default variables
set NODE_URL=https://nodejs.org/dist/v24.1.0/node-v24.1.0-win-x64.zip
set NODE_ZIP=%~dp0node.zip
set INSTALL_DIR=%~dp0server\bin\PortableNode
set CONFIG_FILE=%~dp0config.json

:: ────────── Main Execution ──────────
call :CheckNode
call :AfterNodeCheck
call :InstallDependencies
call :PromptStartServer
exit /b


:: ────────── Check if Node.js exists and is runnable ──────────
:CheckNode
echo %BLUECOLOR%[Debug]%RESET% Checking Node in PATH...
where node >nul 2>&1
if %ERRORLEVEL%==0 (
    echo %GREENCOLOR%[INFO]%RESET% Node found in PATH.
    set "NODE_PATH=node"
    goto NodeReady
)

echo %REDCOLOR%[WARNING]%RESET% Node.js was not found on your system.
choice /C YN /M "Do you want to provide a custom Node.js path? (N to download Node locally)"
if %ERRORLEVEL%==1 (
    :: User selected Y - provide custom path
    set /p USER_NODE_PATH=%GOLDCOLOR%[PROMPT]%RESET% Enter full path to node.exe:
    if exist "%USER_NODE_PATH%" (
        echo %GREENCOLOR%[INFO]%RESET% Using user provided Node.js path: %USER_NODE_PATH%
        set "NODE_PATH=%USER_NODE_PATH%"
        goto NodeReady
    ) else (
        echo %REDCOLOR%[ERROR]%RESET% Path does not exist. Aborting.
        pause
        exit /b 1
    )
) else (
    :: User selected N - download Node locally
    call :DownloadNode
    goto NodeReady
)

:: ────────── Node.js ready label ──────────
:NodeReady
echo %BLUECOLOR%[INFO]%RESET% Using Node.js at %NODE_PATH%
if /I not "%NODE_PATH%"=="node" (
    call :SaveNodePathConfig
)
exit /b


:: ────────── Save Node path to config.json ──────────
:SaveNodePathConfig
set "NODE_PATH_JSON=%NODE_PATH:\=/%"
(
    echo {
    echo   "nodePath": "%NODE_PATH_JSON%"
    echo }
) > "%CONFIG_FILE%"
exit /b


:: ────────── Download and install Node locally ──────────
:DownloadNode
echo %BLUECOLOR%[INFO]%RESET% Downloading and installing Node.js locally...
if not exist "%INSTALL_DIR%" mkdir "%INSTALL_DIR%"
powershell -Command " $ProgressPreference = 'SilentlyContinue'; Invoke-WebRequest -Uri '%NODE_URL%' -OutFile '%NODE_ZIP%' -UseBasicParsing"
if not exist "%NODE_ZIP%" (
    echo %REDCOLOR%[ERROR]%RESET% Download failed or file missing, aborting.
    pause
    exit /b 1
)
powershell -Command "$ProgressPreference = 'SilentlyContinue'; Expand-Archive -Path '%NODE_ZIP%' -DestinationPath '%INSTALL_DIR%' -Force"
echo %BLUECOLOR%[INFO]%RESET% Moving extracted files and folders to parent folder...
for /f "delims=" %%I in ('dir /b /a-d "%INSTALL_DIR%\node-v24.1.0-win-x64"') do (
    move /Y "%INSTALL_DIR%\node-v24.1.0-win-x64\%%I" "%INSTALL_DIR%"
)
for /d %%I in ("%INSTALL_DIR%\node-v24.1.0-win-x64\*") do (
    move /Y "%%I" "%INSTALL_DIR%"
)
rmdir /S /Q "%INSTALL_DIR%\node-v24.1.0-win-x64"
del "%NODE_ZIP%"
set "NODE_PATH=%INSTALL_DIR%\node.exe"
exit /b


:: ────────── After Node check: update PATH if local ──────────
:AfterNodeCheck
if /I "%NODE_PATH%"=="node" (
    rem Node found in system PATH, no need to change PATH
) else (
    set "PATH=%INSTALL_DIR%;%PATH%"
)
exit /b


:: ────────── Install dependencies and ts-node-dev globally ──────────
:InstallDependencies
echo %BLUECOLOR%[INFO]%RESET% Installing ts-node-dev globally...

if "%NODE_PATH%"=="node" (
    :: Node is in PATH, use npm directly
    npm install -g ts-node-dev
) else (
    :: Local Node, run npm via local node path
    "%NODE_PATH%" "%INSTALL_DIR%\node_modules\npm\bin/npm-cli.js" install -g ts-node-dev
)

if errorlevel 1 (
    echo %REDCOLOR%[ERROR]%RESET% Failed to install ts-node-dev globally.
    pause
    exit /b
)

echo %BLUECOLOR%[INFO]%RESET% Installing all npm dependencies from package.json (skip Python and yt-dlp download checks)...

:: Set environment variables to skip python check and yt-dlp download during npm install
set "YOUTUBE_DL_SKIP_PYTHON_CHECK=1"
set "YOUTUBE_DL_SKIP_DOWNLOAD=true"

if "%NODE_PATH%"=="node" (
    npm install
) else (
    "%NODE_PATH%" "%INSTALL_DIR%\node_modules\npm\bin/npm-cli.js" install
)

if errorlevel 1 (
    echo %REDCOLOR%[ERROR]%RESET% Failed to install npm dependencies.
    pause
    exit /b
)

:: Clear the environment variables after install
set "YOUTUBE_DL_SKIP_PYTHON_CHECK="
set "YOUTUBE_DL_SKIP_DOWNLOAD="

echo %GREENCOLOR%[SUCCESS]%RESET% Installation complete.

:: ────────── Prompt user to start the server ──────────
:PromptStartServer
choice /C YN /N /M "%GOLDCOLOR%[PROMPT]%RESET% Do you want to start the server now? (Y/N):"
if errorlevel 2 goto SkipStartServer
if errorlevel 1 (
    echo %BLUECOLOR%[INFO]%RESET% Starting server...
    call "%~dp0START.bat"
)
exit /b

:SkipStartServer
exit /b
