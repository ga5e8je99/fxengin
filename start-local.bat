@echo off
title FXEngin Start Local
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0run.ps1" -Action local
pause
