# Wallet Frontend - Testing Guide

## Quick Start with Expo Go (Recommended)

Due to version compatibility issues with React Native 0.74 and Expo 50 Metro bundler configuration, we recommend testing using **Expo Go** on a physical device or with tunnel mode enabled.

### Option 1: Test with Expo Go App (Physical Device - RECOMMENDED)

1. **Download Expo Go app:**
   - iOS: App Store - search "Expo Go"
   - Android: Google Play - search "Expo Go"

2. **Start development server:**
   ```bash
   cd apps/wallet-frontend
   npx expo start
   ```

3. **Scan QR Code:**
   - Open Expo Go app on your phone
   - Scan the QR code displayed in terminal
   - App will load on your device

4. **Test Features:**
   - ✅ All screens load correctly
   - ✅ API routing works (5/6 services online)
   - ✅ Storage persistence works
   - ✅ Error handling displays properly
   - ✅ Camera works (on physical device)

### Option 2: Use Tunnel Mode (No LAN Required)

```bash
cd apps/wallet-frontend
npx expo start --tunnel
```

Then scan QR code with Expo Go - works even on cellular network.

### Option 3: Web Testing (No Camera)

Camera won't work on web, but all other features test:

```bash
cd apps/wallet-frontend
npx expo start
# Press 'w' to open web
```

**Features testable on web:**
- ✅ All screens layout
- ✅ API integration
- ✅ Error handling
- ✅ Storage (localStorage)
- ✅ User feedback toasts
- ❌ Camera/QR scanning (use manual credential entry instead)

## Available Tests

### Integration Tests
```bash
node test-integration.js
```
Tests API configuration, error handling, storage, hooks, and routing.

### Connectivity Tests
```bash
node test-connectivity.js
```
Checks which backend services are online.

## Backend Services Status

| Service | Port | Status | URL |
|---------|------|--------|-----|
| Veramo Agent | 3001 | ✅ Online | http://localhost:3001 |
| Issuer Service | 3002 | ✅ Online | http://localhost:3002 |
| Verifier Service | 3003 | ✅ Online | http://localhost:3003 |
| Notification Service | 3004 | ✅ Online | http://localhost:3004 |
| API Gateway | 5000 | ✅ Online | http://localhost:5000 |
| Revocation Service | 3005 | ⏳ Offline | http://localhost:3005 |

## What to Test

### 1. Welcome Screen
- ✅ Loads without errors
- ✅ Shows API status
- ✅ Can navigate to other screens

### 2. Credential List Screen
- ✅ Loads stored credentials
- ✅ Displays credential details
- ✅ Can delete credentials
- ✅ Persists across app restarts

### 3. Credential Issuance Screen
- ✅ Loads credential templates from Issuer Service
- ✅ Form validation works
- ✅ Can submit credential request
- ✅ Error messages display properly

### 4. KYC Initiate Screen
- ✅ Loads KYC template
- ✅ Form validation works
- ✅ Can submit KYC initiation
- ✅ Stores KYC session state

### 5. KYC Upload Screen
- ✅ Can select files from device
- ✅ Shows upload progress
- ✅ Handles upload errors gracefully
- ✅ Navigates to verification screen

### 6. KYC Verify Screen
- ✅ Polls for verification status
- ✅ Shows status updates
- ✅ Error handling for timeouts

### 7. Presentation Request Screen
- ✅ Loads credential options
- ✅ Can select credentials to share
- ✅ Validates selection
- ✅ Submits presentation

### 8. QR Scanner Screen
- 📷 Works on physical device with Expo Go
- 🔄 Can use manual credential input as fallback
- ✅ Parses scanned QR data correctly

### 9. Settings Screen
- ✅ Displays current settings
- ✅ Can update preferences
- ✅ Persists across restarts

### 10. Credential Detail Screen
- ✅ Displays full credential information
- ✅ Shows credential status
- ✅ Allows credential operations

## Known Issues & Workarounds

### Issue 1: ExpoCamera Native Module
**Status:** Development mode has metro bundler config issue with RN 0.74
**Workaround:** Use Expo Go app on physical device - camera works perfectly there
**Why:** Expo Go includes pre-compiled native modules, avoiding metro config issues

### Issue 2: Web Testing Without Camera
**Workaround:** All screens work on web except camera. Use manual credential input form instead.

## Environment Variables

The app requires these environment variables (in `.env`):

```
EXPO_PUBLIC_API_URL=http://localhost:5000
```

If testing on physical device, use your machine's IP instead of localhost:

```
EXPO_PUBLIC_API_URL=http://192.168.x.x:5000
```

## Debugging

### View Logs in Expo Go
- Press Ctrl+J in terminal to open debugger
- Or shake device to open menu → "View debug logs"

### Check Network Requests
- Terminal will show all HTTP requests to backend
- Look for `LOG [API]` messages

### Test Storage Persistence
1. Add credential
2. Close app (swipe up on iOS, back button on Android)
3. Reopen app
4. Credential should still be there

## Success Criteria

✅ All tests pass if:
- All 10 screens render without crashes
- API calls go through to backend services
- Error handling displays user-friendly messages
- Data persists across app restarts
- User feedback (toasts) appear correctly
- Camera works (physical device) or manual input works (web)

## Next Steps

1. **Physical Device Testing (Recommended):**
   ```bash
   npx expo start
   # Scan with Expo Go app
   ```

2. **Web Testing (No Camera):**
   ```bash
   npx expo start
   # Press 'w'
   ```

3. **Run Automated Tests:**
   ```bash
   node test-integration.js
   node test-connectivity.js
   ```

## Support

If you encounter issues:
1. Check `CAMERA_SETUP.md` for camera-specific troubleshooting
2. Check backend service status with `test-connectivity.js`
3. Run `check-setup.js` to verify dependencies
4. Review app logs in terminal (Expo shows detailed errors)

---

**Last Updated:** 2026-01-29
