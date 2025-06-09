@echo off
setlocal enabledelayedexpansion

for /f %%a in ('echo prompt $E ^| cmd') do set "ESC=%%a"
set "RESET=%ESC%[0m"
set "GOLDCOLOR=%ESC%[1;38;5;220m"
set "REDCOLOR=%ESC%[1;38;5;196m"
set "BLUECOLOR=%ESC%[1;38;5;75m"
set "GREENCOLOR=%ESC%[1;38;5;46m"

set "NODE_PATH=%CD%\server\bin\PortableNode\node.exe"

if exist "%NODE_PATH%" (
	set "PATH=%CD%\server\bin\PortableNode\;%PATH%"
	call echo !BLUECOLOR![INFO]!RESET! Node.js found at %NODE_PATH%
) else (
	call echo !REDCOLOR![ERROR]!RESET! Node.js not found in PortableNode folder.
	call echo !REDCOLOR![ERROR]!RESET! Please run Install.bat first.
	pause
	exit /b 1
)

call echo !BLUECOLOR![INFO]!RESET! Starting server with npm start...
call echo .
call echo !BLUECOLOR![INFO]!RESET! To close the server do:
call echo !BLUECOLOR![INFO]!RESET! CTRL + C
call echo !BLUECOLOR![INFO]!RESET! OR
call echo !BLUECOLOR![INFO]!RESET! Close this Terminal
npx npm start

endlocal
