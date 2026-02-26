@echo off
title WA-BOT Launcher
color 0A

echo.
echo  =====================================
echo    WA-BOT - Restart Script
echo  =====================================
echo.

echo [1/3] Mematikan proses Chrome yang tersisa...
taskkill /F /IM chrome.exe /T >nul 2>&1
taskkill /F /IM chromium.exe /T >nul 2>&1
taskkill /F /IM node.exe /T >nul 2>&1
timeout /t 2 /nobreak >nul

echo [2/3] Menghapus lock file jika ada...
del /f /q "sessions\Default\SingletonLock" >nul 2>&1
del /f /q "sessions\SingletonLock" >nul 2>&1
timeout /t 1 /nobreak >nul

echo [3/3] Menjalankan bot...
echo.
echo  Bot berjalan! Tunggu QR muncul lalu scan.
echo  Tekan CTRL+C untuk stop bot.
echo.

SET PATH=D:\;%PATH%
D:\node.exe index.js

echo.
echo  Bot berhenti. Tekan sembarang tombol untuk keluar...
pause >nul
