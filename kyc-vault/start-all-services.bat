@echo off
REM Start all KYC Vault backend services

setlocal enabledelayedexpansion

echo.
echo ╔══════════════════════════════════════════════════════╗
echo ║     Starting All Backend Services...                 ║
echo ╚══════════════════════════════════════════════════════╝
echo.

cd /d "c:\Users\Admin\Desktop\kyc-vault\kyc-vault"

echo [1/6] Starting API Gateway on port 5000...
start "API Gateway" cmd /k "cd apps\api && npm run dev"
timeout /t 2 /nobreak

echo [2/6] Starting Veramo Agent on port 3001...
start "Veramo Agent" cmd /k "cd services\veramo-agent && npm run dev"
timeout /t 2 /nobreak

echo [3/6] Starting Issuer Service on port 3002...
start "Issuer Service" cmd /k "cd services\issuer-service && npm run dev"
timeout /t 2 /nobreak

echo [4/6] Starting Verifier Service on port 3003...
start "Verifier Service" cmd /k "cd services\verifier-service && npm run dev"
timeout /t 2 /nobreak

echo [5/6] Starting Notification Service on port 3004...
start "Notification Service" cmd /k "cd services\notification-service && npm run dev"
timeout /t 2 /nobreak

echo [6/6] Starting Revocation Service on port 3005...
start "Revocation Service" cmd /k "cd services\revocation-service && npm run dev"
timeout /t 2 /nobreak

echo.
echo ╔══════════════════════════════════════════════════════╗
echo ║     Services starting in separate windows...         ║
echo ║                                                      ║
echo ║  ✓ API Gateway (5000)                               ║
echo ║  ✓ Veramo Agent (3001)                              ║
echo ║  ✓ Issuer Service (3002)                            ║
echo ║  ✓ Verifier Service (3003)                          ║
echo ║  ✓ Notification Service (3004)                      ║
echo ║  ✓ Revocation Service (3005)                        ║
echo ║                                                      ║
echo ║  Wait 10-15 seconds for all to fully start...        ║
echo ║  Then check connectivity:                           ║
echo ║  cd apps\wallet-frontend && node test-connectivity  ║
echo ╚══════════════════════════════════════════════════════╝
echo.

endlocal
