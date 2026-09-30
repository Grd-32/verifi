@echo off
REM Start all KYC Vault backend services - CORRECTED VERSION

setlocal enabledelayedexpansion

echo.
echo ╔══════════════════════════════════════════════════════╗
echo ║   Starting All KYC Vault Backend Services            ║
echo ║   (Building NestJS services first)                   ║
echo ╚══════════════════════════════════════════════════════╝
echo.

cd /d "c:\Users\Admin\Desktop\kyc-vault\kyc-vault"

REM Build all NestJS services first
echo Building NestJS services (one-time)...
cd services\issuer-service && npm run build >nul 2>&1
cd ..\verifier-service && npm run build >nul 2>&1
cd ..\notification-service && npm run build >nul 2>&1
cd ..\revocation-service && npm run build >nul 2>&1
cd ..\..
echo.

REM Now start each service
echo [1/6] API Gateway on port 5000...
start "API Gateway" cmd /k "cd apps\api && npm run dev"
timeout /t 3 /nobreak

echo [2/6] Veramo Agent on port 3001...
start "Veramo Agent" cmd /k "cd services\veramo-agent && npm run dev"
timeout /t 3 /nobreak

echo [3/6] Issuer Service on port 3002...
start "Issuer Service" cmd /k "cd services\issuer-service && node dist\main.js"
timeout /t 3 /nobreak

echo [4/6] Verifier Service on port 3003...
start "Verifier Service" cmd /k "cd services\verifier-service && node dist\main.js"
timeout /t 3 /nobreak

echo [5/6] Notification Service on port 3004...
start "Notification Service" cmd /k "cd services\notification-service && node dist\main.js"
timeout /t 3 /nobreak

echo [6/6] Revocation Service on port 3005...
start "Revocation Service" cmd /k "cd services\revocation-service && node dist\main.js"
timeout /t 3 /nobreak

echo.
echo ╔══════════════════════════════════════════════════════╗
echo ║     All services launched!                           ║
echo ║                                                      ║
echo ║  Services should be listening on:                   ║
echo ║  • API Gateway (5000)                               ║
echo ║  • Veramo Agent (3001)                              ║
echo ║  • Issuer Service (3002)                            ║
echo ║  • Verifier Service (3003)                          ║
echo ║  • Notification Service (3004)                      ║
echo ║  • Revocation Service (3005)                        ║
echo ║                                                      ║
echo ║  Wait 15-20 seconds, then verify:                   ║
echo ║  cd apps\wallet-frontend ^&^& node test-connectivity ║
echo ║                                                      ║
echo ║  Then start wallet:                                 ║
echo ║  npx expo start                                      ║
echo ╚══════════════════════════════════════════════════════╝
echo.

endlocal
