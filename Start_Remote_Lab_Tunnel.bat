@echo off
title ACE Prosoft V2 - Remote Lab Internet Tunnel
color 0b

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\start-tunnel.ps1"

pause
