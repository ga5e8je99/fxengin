@echo off
title FXEngin Start Server
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0run.ps1" -Action server
pause
