@echo off
title FXEngin Stop
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0run.ps1" -Action stop
