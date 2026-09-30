# KYC Vault Wallet Frontend

Complete React Native (Expo) implementation of the KYC Vault SSI wallet with full integration to the backend APIs.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ (for pnpm)
- pnpm 10.20.0
- iOS Simulator or Android Emulator (for mobile testing)
- Expo CLI (included via pnpm)

### Installation

```bash
# From kyc-vault root directory
pnpm install

# Start the wallet in development mode
cd apps/wallet-frontend
pnpm dev

# For iOS (requires macOS)
expo run:ios

# For Android
expo run:android

# For web
expo start --web
```

## 📱 Features Implemented

### ✅ Core Screens
1. **Welcome Screen** - Wallet initialization with DID creation
2. **Credential List** - View all stored credentials with quick actions
3. **Credential Detail** - Full credential information and verification status
4. **Presentation Request** - Handle verification requests from verifiers
5. **Settings** - Wallet configuration and information

### ✅ Storage
- **AsyncStorage** - Encrypted credential and data persistence
- **SecureStore** - Private key KMS storage (encrypted at rest)
- **Verification Cache** - 24-hour verification result caching

### ✅ API Integration
- **DID Creation** - Generate decentralized identities
- **Credential Verification** - Validate credentials with backend
- **Presentation Creation** - Build presentations from credentials
- **Verification Requests** - Handle presentation requests
- **Health Checks** - API connectivity monitoring

### ✅ State Management
- **Zustand Store** - Global wallet and presentation state
- **Wallet State** - DID, credentials, settings
- **Presentation State** - Current request, selections, results

### ✅ Navigation
- **Stack Navigation** - Screen transitions with animations
- **Bottom Tab Navigation** - Main app organization
- **Deep Linking** - Handle QR codes and deep links

## 🏗️ Architecture

```
src/
├── screens/              # 5 main screens
│   ├── WelcomeScreen.tsx
│   ├── CredentialListScreen.tsx
│   ├── CredentialDetailScreen.tsx
│   ├── PresentationRequestScreen.tsx
│   └── SettingsScreen.tsx
├── services/             # Backend integration
│   ├── api.ts           # API client with all endpoints
│   └── storage.ts       # Local storage management
├── store/               # State management
│   └── index.ts         # Zustand stores
├── navigation/          # Navigation setup
│   └── index.tsx        # Stack & tab navigation
├── types/               # TypeScript definitions
│   └── index.ts         # All types and interfaces
├── utils/               # Utility functions
│   └── index.ts         # Helpers and formatters
├── App.tsx              # Main app component
└── index.tsx            # Entry point
```

## 🔧 Configuration

### Environment Variables

Create `.env.local` in `apps/wallet-frontend/`:

```env
# API Configuration
EXPO_PUBLIC_API_URL=http://localhost:3001
EXPO_PUBLIC_API_TIMEOUT=30000

# Logging
EXPO_PUBLIC_LOG_LEVEL=debug

# Features
EXPO_PUBLIC_ENABLE_MOCK_DATA=false
```

For production, create `.env.production`:

```env
EXPO_PUBLIC_API_URL=https://api.kyc-vault.prod
EXPO_PUBLIC_API_TIMEOUT=30000
EXPO_PUBLIC_LOG_LEVEL=error
EXPO_PUBLIC_ENABLE_MOCK_DATA=false
```

## 📦 API Endpoints Used

All endpoints require local backend running on port 3001:

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/did` | POST | Create new DID |
| `/api/vc/issue` | POST | Issue credential |
| `/api/vc/verify` | POST | Verify credential JWT |
| `/api/vc/present` | POST | Create presentation |
| `/api/verifier/request/:id` | GET | Get verification request |
| `/api/verifier/verify/:id` | POST | Submit presentation |
| `/api/issuer/templates/:did` | GET | List templates |
| `/api/issuer/issuance/issue` | POST | Issue credential |
| `/health` | GET | Health check |

## 🔐 Security Features

### Private Key Management
- Private keys stored in **expo-secure-store** (encrypted at rest)
- Never transmitted over unencrypted connections
- Never logged or exposed to console

### Credential Verification
- All credentials verified before storage
- Verification results cached for 24 hours
- DID resolution validates issuer authenticity

### Deep Link Validation
- All deep links validated against whitelist
- Request IDs validated as proper UUIDs
- Prevents malicious link injection

## 💾 Local Storage Schema

### Credentials (AsyncStorage)
```json
{
  "@kyc_vault/credentials": [
    {
      "id": "uuid",
      "jwt": "eyJ...",
      "templateName": "National ID",
      "issuerDid": "did:key:...",
      "claims": { "firstName": "John", "dateOfBirth": "1990-01-01" },
      "issuedAt": 1674000000,
      "verified": true,
      "verificationPayload": { "verified": true, ... }
    }
  ]
}
```

### Wallet Identity
```json
{
  "@kyc_vault/wallet_did": "did:key:z6MkpkagMDbpzRAkn3wiVCe5mDN1RXo6rn14PNJ59kCNG9yM",
  "@kyc_vault/wallet_alias": "My Wallet",
  "@kyc_vault/initialized": "true"
}
```

### Settings
```json
{
  "@kyc_vault/settings": {
    "theme": "light",
    "notificationsEnabled": true,
    "autoVerifyCredentials": true,
    "hapticEnabled": true
  }
}
```

### Secure Storage (encrypted)
```
wallet_private_key_encrypted: "...base64 encrypted private key..."
```

## 🎯 Workflow Examples

### Create Wallet & Receive First Credential

```
1. User taps "Create Wallet" on WelcomeScreen
2. POST /api/did → receives did:key DID
3. DID stored in SecureStore + AsyncStorage
4. Navigate to CredentialListScreen
5. Wallet ready to receive credentials
```

### Receive & Verify Credential

```
1. User receives credential JWT from issuer
2. POST /api/vc/verify → verify JWT signature
3. DID resolution validates issuer
4. Credential stored with verification result
5. Displays in CredentialListScreen
```

### Share Credential via QR Code

```
1. User scans QR code from verifier
2. Opens PresentationRequestScreen with requestId
3. GET /api/verifier/request/:id → shows requirements
4. User selects matching credentials
5. POST /api/vc/present → creates presentation
6. POST /api/verifier/verify/:id → submits
7. Verifier receives and validates
```

## 🧪 Testing

### Unit Tests
```bash
pnpm test
```

### Running on Emulator
```bash
# iOS (macOS only)
expo run:ios --simulator "iPhone 15"

# Android
expo run:android --device
```

### Running on Physical Device
1. Install Expo Go app
2. Run `expo start --tunnel`
3. Scan QR code with Expo Go

### Testing Deep Links
```bash
# iOS Simulator
xcrun simctl openurl booted "kyc-vault://verify?requestId=550e8400-e29b-41d4-a716-446655440000"

# Android
adb shell am start -W -a android.intent.action.VIEW -d "kyc-vault://verify?requestId=550e8400-e29b-41d4-a716-446655440000" com.kycvault.wallet
```

## 🚀 Building for Production

### Build APK (Android)
```bash
eas build --platform android
```

### Build IPA (iOS)
```bash
eas build --platform ios
```

### App Store Submission
```bash
# Update version in app.json
eas submit --platform ios
eas submit --platform android
```

## 📊 Performance Optimization

### Code Splitting
- Screens lazy-loaded via React Navigation
- Large screens split into components

### Credential Caching
- Verification results cached 24 hours
- Reduces API calls for repeated verifications

### Image Optimization
- Expo Image component with memory-disk caching
- Properly sized icons and assets

### State Management
- Zustand for minimal bundle size
- No Redux boilerplate overhead

## 🔗 Deep Linking Setup

### iOS Configuration
Add to `app.json`:
```json
{
  "expo": {
    "scheme": "kyc-vault",
    "plugins": ["expo-secure-store"]
  }
}
```

### Android Configuration
Add to `app.json`:
```json
{
  "android": {
    "intentFilters": [
      {
        "action": "VIEW",
        "autoVerify": true,
        "data": {
          "scheme": "https",
          "host": "kyc-vault.app",
          "pathPrefix": "/verify"
        }
      }
    ]
  }
}
```

## 🐛 Troubleshooting

### "Failed to connect to API"
- Ensure backend is running on port 3001
- Check `EXPO_PUBLIC_API_URL` environment variable
- Verify network connectivity

### "Credential verification failed"
- Check that issuer DID is properly resolved
- Verify JWT signature is valid
- Ensure credential hasn't expired

### "Deep link not working"
- Verify request ID is valid UUID
- Check deep link configuration in app.json
- Test with simulator/device

### "AsyncStorage not persisting"
- Check device storage permissions
- On Android, may need to request storage permission
- Try reinstalling app

## 📝 API Documentation

See [WALLET_FRONTEND_IMPLEMENTATION_GUIDE.md](../../WALLET_FRONTEND_IMPLEMENTATION_GUIDE.md) for:
- Detailed screen implementation guide
- API integration examples
- State management patterns
- Security best practices
- Testing strategies

## 🤝 Development

### Adding New Screens

1. Create screen in `src/screens/`
2. Add route to navigation in `src/navigation/index.tsx`
3. Use `useWalletStore()` and `usePresentationStore()` for state
4. Call `api.*` methods from services

### Adding New API Endpoints

1. Add method to `api.ts` service class
2. Add response type to `types/index.ts`
3. Handle errors with `handleError()` method
4. Export from api service

### Adding Storage

1. Add key to `STORAGE_KEYS` in `storage.ts`
2. Create storage method (credentialStorage, walletIdentityStorage, etc.)
3. Handle errors gracefully
4. Document in storage schema

## 📚 Related Documentation

- [System Validation Report](../../SYSTEM_VALIDATION_REPORT.md) - Full system status
- [Implementation Guide](../../WALLET_FRONTEND_IMPLEMENTATION_GUIDE.md) - Detailed guide
- [Backend API](../api/README.md) - Backend services
- [Veramo Agent](../api/src/services/veramo/README.md) - Identity agent

## 📄 License

MIT License - See LICENSE file

---

**Status**: ✅ Production Ready

All features implemented and tested. Ready for:
- ✅ Expo development server (`pnpm dev`)
- ✅ iOS simulator (`expo run:ios`)
- ✅ Android emulator (`expo run:android`)
- ✅ Web browser (`expo start --web`)
- ✅ Physical device (Expo Go app)
- ✅ App store release builds
