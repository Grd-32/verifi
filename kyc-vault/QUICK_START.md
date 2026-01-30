# Quick Start - Testing Wallet Frontend

## Prerequisites
- Node.js 16+ and npm/pnpm
- Android emulator, iOS simulator, or Expo Go app on phone
- All 6 backend services built

## Step 1: Start Backend Services (5/6 Online)

Open 6 terminals and run:

### Terminal 1: Veramo Agent (3001) ✅
```bash
cd services/veramo-agent
npm run build
node dist/index.js
```

### Terminal 2: Issuer Service (3002) ✅
```bash
cd services/issuer-service
npm run build
node dist/main.js
```

### Terminal 3: Verifier Service (3003) ✅
```bash
cd services/verifier-service
npm run build
node dist/main.js
```

### Terminal 4: Notification Service (3004) ✅
```bash
cd services/notification-service
npm run build
node dist/main.js
```

### Terminal 5: Revocation Service (3005) ⚠️
```bash
cd services/revocation-service
npm run build
node dist/main.js
```

### Terminal 6: API Gateway (5000) ✅
```bash
cd apps/api
npm run build
node dist/server.js
# Or if it's Express:
node index.js
```

## Step 2: Verify Services Are Running
```bash
node test-connectivity.js
```

Expected output:
```
Service Status:
──────────────────────────────────────────────────
  Veramo Agent              ✓ ONLINE (200)
  Issuer Service            ✓ ONLINE (200)
  Verifier Service          ✓ ONLINE (200)
  Notification Service      ✓ ONLINE (200)
  Revocation Service        ✓ ONLINE (200)
  API Gateway               ✓ ONLINE (200)
──────────────────────────────────────────────────

Summary: 6 Online, 0 Offline
```

## Step 3: Start Wallet Frontend
```bash
cd apps/wallet-frontend
npx expo start --clear
```

## Step 4: Run on Device

### Option A: Scan QR Code (Phone)
- Open Expo Go app
- Scan QR code from terminal
- App loads on your phone

### Option B: Android Emulator
- Press `a` in Expo terminal
- App launches in emulator

### Option C: iOS Simulator (Mac only)
- Press `i` in Expo terminal
- App launches in simulator

## Step 5: Test Wallet Features

### Test 1: Create Wallet DID
1. Launch app
2. Should see "Welcome" or "Credentials" screen
3. Check console logs for DID creation

### Test 2: View Credential List
1. Navigate to Credentials tab
2. Should show empty list or existing credentials
3. Check for proper API calls in console

### Test 3: Issue a Credential
1. Look for "Request Credential" or similar
2. Select an issuer
3. Fill in credential claims
4. Submit and verify in credential list

### Test 4: Complete KYC Flow
1. Navigate to KYC section
2. Fill in personal information (name, email, phone)
3. Click "Start Verification"
4. Upload documents (passport, selfie, etc.)
5. Monitor verification progress
6. Check for success message

### Test 5: Share Credential
1. Go to a credential
2. Look for "Share" or "Present" option
3. Select verifier
4. Confirm credentials to share
5. Check for success message

### Test 6: Scan QR Code
1. Navigate to QR scanner
2. Generate test QR code with presentation request
3. Scan it
4. Should trigger credential sharing flow

## Troubleshooting

### Services Won't Start
```bash
# Check if ports are in use
netstat -ano | findstr "3001\|3002\|3003\|3004\|3005\|5000"

# Kill existing Node processes
Get-Process node | Stop-Process -Force

# Try again
```

### Expo Connection Issues
```bash
# Clear cache and restart
npx expo start --clear

# Use tunnel mode if LAN not working
npx expo start --tunnel
```

### API Errors in Console
1. Check backend services are running
2. Verify connectivity: `node test-connectivity.js`
3. Check console logs for specific error codes
4. Use error code to look up in `DEVELOPER_GUIDE.md`

### Can't Find Screen
1. Check navigation structure in `navigation/index.tsx`
2. Navigate using tab bar or stack navigation
3. Check for nested navigators

## Testing Checklist

- [ ] App launches without crash
- [ ] DID is created on first launch
- [ ] Credentials list loads (empty is OK)
- [ ] Form validation works
- [ ] KYC form submits successfully
- [ ] Document upload shows progress
- [ ] Verification completes
- [ ] Error messages are user-friendly
- [ ] Toast notifications appear
- [ ] Data persists after app restart
- [ ] All screens are accessible
- [ ] QR scanner works
- [ ] Credential sharing completes

## Performance Baseline

- App startup: <3 seconds
- API call response: <2 seconds
- Form validation: <100ms
- Credential list load: <1 second
- Document upload: Based on file size

## API Test Examples

### Create DID
```bash
curl -X POST http://localhost:3001/api/did \
  -H "Content-Type: application/json" \
  -d '{"didMethod":"did:key"}'
```

### Get Templates
```bash
curl http://localhost:3002/api/issuer/templates/did:example:issuer
```

### Initiate KYC
```bash
curl -X POST http://localhost:5000/api/kyc/initiate \
  -H "Content-Type: application/json" \
  -d '{
    "walletDid":"did:key:xxx",
    "applicantName":"John Doe",
    "applicantEmail":"john@example.com"
  }'
```

## Log Levels

In console output, look for:
- `[API]` - API calls and responses
- `[Toast]` - User notifications
- `[Store]` - State management
- `[Storage]` - Persistence operations
- `[ErrorHandler]` - Error handling

## Success Indicators

✅ App starts without errors  
✅ Wallet DID created  
✅ All API calls succeed  
✅ Data persists  
✅ Error messages are helpful  
✅ All screens navigate correctly  
✅ Toast notifications appear  

## Next Steps After Testing

1. Document any bugs found
2. Create issues for improvements
3. Run unit tests (coming next)
4. Deploy to test environment
5. Plan for production

## Support

For detailed information:
- See `IMPLEMENTATION_SUMMARY.md` for technical details
- See `DEVELOPER_GUIDE.md` for code examples
- See `TEST_REPORT.md` for test results
- See logs in terminal and app console

---

**Happy Testing! 🚀**
