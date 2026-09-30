@echo off
REM Wallet Frontend - Start Script (Windows)
REM Usage: start.bat [option]
REM Options: web, android, ios, tunnel

setlocal enabledelayedexpansion

echo.
echo ╔════════════════════════════════════════╗
echo ║  KYC Vault - Wallet Frontend Startup   ║
echo ╚════════════════════════════════════════╝
echo.

REM Check if node_modules exists
if not exist "node_modules" (
    echo Installing dependencies...
    call pnpm install
    echo ✅ Dependencies installed
    echo.
)

REM Determine which platform to use
set PLATFORM=%1
if "%PLATFORM%"=="" (
    set PLATFORM=default
)

if "%PLATFORM%"=="web" (
    echo Starting Expo Web Server...
    call npx expo start --web
) else if "%PLATFORM%"=="android" (
    echo Starting Expo for Android Emulator...
    call npx expo start --clear
    echo Press 'a' when prompt appears to start Android emulator
) else if "%PLATFORM%"=="ios" (
    echo Starting Expo for iOS Simulator...
    call npx expo start --clear
    echo Press 'i' when prompt appears to start iOS simulator
) else if "%PLATFORM%"=="tunnel" (
    echo Starting Expo with Tunnel Mode...
    echo Scan QR code with Expo Go app (works on cellular)
    call npx expo start --tunnel
) else (
    echo Starting Expo Development Server...
    echo.
    echo Options:
    echo   a - Android Emulator (recommended)
    echo   i - iOS Simulator (Mac only)
    echo   w - Web Browser (no camera)
    echo   scan - Expo Go (scan QR with phone)
    echo.
    call npx expo start --clear
)

endlocal

