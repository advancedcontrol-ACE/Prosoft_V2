@echo off
setlocal EnableDelayedExpansion
title ACE Prosoft V2.0 - Product Setup Launcher

echo ===================================================
echo    ACE Prosoft V2.0 - Product Setup Launcher
echo    Advanced Control Equipments
echo ===================================================
echo.

set /p USER_EMAIL="Enter College Email ID (e.g. meena.sundar@manipal.edu): "
if "%USER_EMAIL%"=="" (
    echo Error: Email cannot be empty.
    pause
    exit /b 1
)

set /p USER_PASS="Enter Password: "
if "%USER_PASS%"=="" (
    echo Error: Password cannot be empty.
    pause
    exit /b 1
)

echo.
echo [1/3] Authenticating with ACE Cloud Server...
set TEMP_RESP=%TEMP%\ace_auth_resp.json
set PAYLOAD={"email":"%USER_EMAIL%","password":"%USER_PASS%","machineName":"%COMPUTERNAME%"}

curl -s -X POST -H "Content-Type: application/json" -d "%PAYLOAD%" https://admin-portal-sable-omega.vercel.app/api/auth-install > "%TEMP_RESP%"

findstr /i "\"success\":true" "%TEMP_RESP%" >nul
if errorlevel 1 (
    echo.
    echo [ERROR] Authentication Failed!
    type "%TEMP_RESP%"
    echo.
    pause
    exit /b 1
)

echo [2/3] Authentication Successful!
echo.
type "%TEMP_RESP%"
echo.

set CONFIG_DIR=%LOCALAPPDATA%\ACE_Prosoft_V2
if not exist "%CONFIG_DIR%" mkdir "%CONFIG_DIR%"
copy /y "%TEMP_RESP%" "%CONFIG_DIR%\installed_modules.json" >nul

echo [3/3] Entitlement profile written to:
echo       %CONFIG_DIR%\installed_modules.json
echo.
echo ===================================================
echo    Downloading ACE Prosoft V2.0 Setup (123 MB)...
echo ===================================================
set SETUP_EXE=%TEMP%\ACE.Prosoft.V2.Setup.2.0.0.exe
if not exist "%SETUP_EXE%" (
    curl.exe -# -L -o "%SETUP_EXE%" "https://github.com/meenasundaratgmaildotcom/ACE-Prosoft-Releases/releases/download/v2.0.0/ACE.Prosoft.V2.Setup.2.0.0.exe"
)
echo.
echo Launching installer wizard...
start "" "%SETUP_EXE%"
echo Installation wizard started.

