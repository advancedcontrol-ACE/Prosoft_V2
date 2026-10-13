@echo off
setlocal
cd /d "%~dp0"

set "URL=http://localhost:5173"
set "PORT=5173"

rem Ensure Node / npm is in PATH
where npm >nul 2>&1
if errorlevel 1 (
    if exist "C:\Program Files\nodejs\npm.cmd" (
        set "PATH=C:\Program Files\nodejs;%PATH%"
    )
)

rem Check if dev server is already running
where curl.exe >nul 2>&1
if not errorlevel 1 (
    curl.exe -s -m 1 -o NUL http://localhost:%PORT%/ >nul 2>&1
    if not errorlevel 1 goto LAUNCH_APP
)

netstat -ano | findstr /r ":%PORT%[^0-9]" | findstr /i "LISTENING" >nul 2>&1
if not errorlevel 1 goto LAUNCH_APP

rem Start dev server silently
if exist "%~dp0start_dev.vbs" (
    wscript.exe //B "%~dp0start_dev.vbs"
) else (
    start "" /min cmd.exe /c "npm run dev"
)

rem Wait for dev server to start
set /a ATTEMPTS=0

:WAIT_DEV
set /a ATTEMPTS+=1
timeout /t 1 /nobreak >nul 2>&1

where curl.exe >nul 2>&1
if not errorlevel 1 (
    curl.exe -s -m 1 -o NUL http://localhost:%PORT%/ >nul 2>&1
    if not errorlevel 1 goto LAUNCH_APP
)

netstat -ano | findstr /r ":%PORT%[^0-9]" | findstr /i "LISTENING" >nul 2>&1
if not errorlevel 1 goto LAUNCH_APP

if %ATTEMPTS% LSS 30 goto WAIT_DEV

:LAUNCH_APP
if exist "C:\Program Files\Google\Chrome\Application\chrome.exe" (
    start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" --app=%URL% --start-maximized
    goto DO_LOCK
)

if exist "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" (
    start "" "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" --app=%URL% --start-maximized
    goto DO_LOCK
)

if exist "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" (
    start "" "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" --app=%URL% --start-maximized
    goto DO_LOCK
)

if exist "C:\Program Files\Microsoft\Edge\Application\msedge.exe" (
    start "" "C:\Program Files\Microsoft\Edge\Application\msedge.exe" --app=%URL% --start-maximized
    goto DO_LOCK
)

start "" "%URL%"

:DO_LOCK
if exist "%~dp0lock_window.ps1" (
    start "" /b powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0lock_window.ps1"
)

exit /b