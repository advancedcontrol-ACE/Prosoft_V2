@echo off
title ACE Prosoft V2 - Remote Lab Internet Tunnel
color 0b
echo ======================================================================
echo    ACE PROSOFT V2 - ZERO-INSTALL REMOTE LAB INTERNET TUNNEL
echo ======================================================================
echo.
echo  This script creates a secure, temporary, public HTTPS link across
echo  the Internet using Cloudflare Tunnel (100%% Free, No Account Needed).
echo.

set CLOUDFLARED_EXE=%~dp0cloudflared.exe

if not exist "%CLOUDFLARED_EXE%" (
    echo  [Step 1/2] Downloading official standalone cloudflared.exe runner...
    powershell -NoProfile -ExecutionPolicy Bypass -Command "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri 'https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe' -OutFile '%CLOUDFLARED_EXE%'"
    if not exist "%CLOUDFLARED_EXE%" (
        echo  [ERROR] Failed to download cloudflared.exe. Please check your internet connection.
        pause
        exit /b 1
    )
    echo  [Done] cloudflared.exe is ready!
    echo.
)

echo  [Step 2/2] Starting secure Internet Tunnel to ACE Prosoft V2...
echo.
echo  --------------------------------------------------------------------
echo  INSTRUCTIONS:
echo    1. Look for the line below starting with:
echo       https://[random-name].trycloudflare.com
echo    2. Copy that link and give it to your remote students.
echo    3. Tell your students your Passkey (default: ACE-101).
echo    4. Keep this black console window open while the lab session is active.
echo  --------------------------------------------------------------------
echo.

"%CLOUDFLARED_EXE%" tunnel --url http://127.0.0.1:5173

pause
