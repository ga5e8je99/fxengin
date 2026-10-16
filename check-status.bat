@echo off
title FXEngin Status
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0run.ps1" -Action status
