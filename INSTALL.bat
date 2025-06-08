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

set NODE_URL=https://nodejs.org/dist/v24.1.0/node-v24.1.0-win-x64.zip
set NODE_ZIP=%~dp0node.zip
set INSTALL_DIR=%~dp0server\bin\PortableNode

if not exist "%INSTALL_DIR%" mkdir "%INSTALL_DIR%"

echo %BLUECOLOR%[INFO]%RESET% Downloading Node.js...
powershell -Command " $ProgressPreference = 'SilentlyContinue'; Invoke-WebRequest -Uri '%NODE_URL%' -OutFile '%NODE_ZIP%' -UseBasicParsing"

if not exist "%NODE_ZIP%" (
	echo %REDCOLOR%[ERROR]%RESET% Download failed or file missing, aborting.
	exit /b 1
)

echo %BLUECOLOR%[INFO]%RESET% Extracting Node.js...
powershell -Command "Expand-Archive -Path '%NODE_ZIP%' -DestinationPath '%INSTALL_DIR%' -Force"

echo %BLUECOLOR%[INFO]%RESET% Moving extracted files and folders to parent folder...
for /f "delims=" %%I in ('dir /b /a-d "%INSTALL_DIR%\node-v24.1.0-win-x64"') do (
	move /Y "%INSTALL_DIR%\node-v24.1.0-win-x64\%%I" "%INSTALL_DIR%"
)
for /d %%I in ("%INSTALL_DIR%\node-v24.1.0-win-x64\*") do (
	move /Y "%%I" "%INSTALL_DIR%"
)
rmdir /S /Q "%INSTALL_DIR%\node-v24.1.0-win-x64"

del "%NODE_ZIP%"

set PATH=%INSTALL_DIR%;%PATH%

echo %BLUECOLOR%[INFO]%RESET% Installing ts-node-dev globally...
"%INSTALL_DIR%\node.exe" "%INSTALL_DIR%\node_modules\npm\bin\npm-cli.js" install -g ts-node-dev

echo %BLUECOLOR%[INFO]%RESET% Installing all npm dependencies from package.json...
"%INSTALL_DIR%\node.exe" "%INSTALL_DIR%\node_modules\npm\bin\npm-cli.js" install

echo %GREENCOLOR%[SUCCESS]%RESET% Installation complete.

set /p START_SERVER=%GOLDCOLOR%[PROMPT]%RESET% Do you want to start the server now? (Y/N):
if /i "%START_SERVER%"=="Y" (
	echo %BLUECOLOR%[INFO]%RESET% Starting server...
	call "%~dp0START.bat"
)

pause
