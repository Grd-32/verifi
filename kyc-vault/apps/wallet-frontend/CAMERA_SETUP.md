# Expo Camera Setup & Troubleshooting Guide

## Issue
```
ERROR  Error: Cannot find native module 'ExpoCamera'
WARN  The native view manager required by name (ExpoCamera)...
```

## Root Cause
The expo-camera native module isn't properly compiled/linked for your development environment (Hermes engine with React Native 0.74).

## Solution

### Step 1: Clean Everything
```bash
cd apps/wallet-frontend

# Kill Expo server
Get-Process node | Stop-Process -Force

# Clear all caches
rm -r .expo
rm -r node_modules
rm -r android (if exists)
```

### Step 2: Reinstall Dependencies
```bash
npm install
# or if using pnpm:
pnpm install
```

### Step 3: Rebuild Expo
```bash
# Clear Metro bundler cache and restart
npx expo start --clear
```

### Step 4: Select Correct Development Environment
When Expo prompt appears:
```
Press 'a' for Android emulator (recommended for camera)
Press 'i' for iOS simulator (Mac only)
Press 'w' for web (camera won't work)
Press 's' for Snack
```

**Select 'a' for Android if available** - Camera support is most stable there.

## If Still Having Issues

### Option 1: Use Expo Go App on Phone
```bash
npx expo start
# Scan QR code with Expo Go app on physical device
# This bypasses native module issues
```

### Option 2: Use Web Simulator (Camera Won't Work)
```bash
npx expo start --web
# This will work for testing non-camera screens
```

### Option 3: Rebuild from Scratch
```bash
# Delete node_modules and lock file
rm -r node_modules
rm package-lock.json (or pnpm-lock.yaml)

# Reinstall
npm install

# Clear prebuild
npx expo prebuild --clean

# Start fresh
npx expo start --clear
```

### Option 4: Use Tunnel Mode
```bash
npx expo start --tunnel
# This can sometimes resolve network/module issues
```

## Verify Setup

### Check if expo-camera is installed:
```bash
npm list expo-camera
# Should show: expo-camera@~14.0.0
```

### Check if all Expo modules are present:
```bash
npm list | grep expo
# Should list: expo, expo-camera, expo-document-picker, etc.
```

### Test Camera Separately
Create a simple test component to verify camera works:

```typescript
import { Camera } from 'expo-camera';
import { View } from 'react-native';

export function CameraTest() {
  return (
    <View style={{ flex: 1 }}>
      <Camera style={{ flex: 1 }} />
    </View>
  );
}
```

If this renders without error, camera is working!

## Environment Configuration

The `app.json` has been updated with:
- ✅ Camera plugin configuration
- ✅ Document picker plugin configuration
- ✅ Required permissions for iOS/Android
- ✅ Splash screen configuration
- ✅ Dark mode UI preference

## Quick Start After Fix

```bash
cd apps/wallet-frontend

# 1. Clean start
npx expo start --clear

# 2. When prompt appears, select:
#    'a' for Android emulator
#    or 's' to Snack

# 3. App should load without native module errors

# 4. Test QRScannerScreen - camera should work
```

## Expected Output

After successful startup, you should see:
```
Expo URL: <URL>
Android Emulator: Connected

✓ Successfully compiled your React Native app
```

**NOT:**
```
ERROR Cannot find native module 'ExpoCamera'
ERROR ExpoCamera hasn't been registered
```

## If Camera Still Doesn't Work

**Use as Fallback:** The app will still work! QRScannerScreen can:
1. Fall back to manual input (paste request code)
2. All other screens work without camera
3. You can test non-camera flows

### Test Without Camera:
1. Go to PresentationRequestScreen
2. Manually paste a request code instead of scanning
3. Complete credential sharing flow
4. This tests 95% of wallet functionality

## Support

If issues persist:
1. Check Metro is running from correct folder
2. Verify `package.json` has `expo-camera@~14.0.0`
3. Check `app.json` has camera plugins configured
4. Try `npx expo doctor` for diagnostic info
5. Use physical device instead of emulator (more stable)

## Next Steps

✅ app.json updated with camera configuration  
✅ Ready to restart Expo with `npx expo start --clear`  
✅ Select Android/iOS when prompted  
✅ App should load without native module errors  

**Testing screens with camera:**
- ✅ QRScannerScreen (camera required)
- ✅ KYCUploadScreen (document picker, not camera)
- ✅ All other 8 screens (no camera needed)
