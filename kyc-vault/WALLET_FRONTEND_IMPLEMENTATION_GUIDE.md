# Wallet Frontend Implementation Guide

**Target**: React Native (Expo) at `apps/wallet-frontend`  
**Status**: Ready for development  
**API Base URL**: `http://localhost:3001` (local), `https://api.kyc-vault.prod` (production)

---

## Architecture Overview

### Backend API Integration Points

#### 1. DID Management
```typescript
// Create a new DID for wallet user
POST /api/did
Request: { didMethod: "did:key" }
Response: { data: { did: "did:key:...", controllerKeyId: "..." } }
```

**Use Case**: Wallet initialization - create user's identity DID

#### 2. Credential Issuance
```typescript
// Issue credential to user
POST /api/issuer/issuance/issue
Request: {
  templateId: string,
  issuerDid: string,
  subjectDid: string, // User's wallet DID
  claims: Record<string, any>
}
Response: { data: { credentialId, status: "issued", issuedAt } }
```

**Use Case**: Receive credentials from issuers

#### 3. Credential Verification
```typescript
// Verify a credential before storing
POST /api/vc/verify
Request: { credential: jwtString }
Response: { data: { verified: true, payload, signer } }
```

**Use Case**: Validate credential authenticity before storage

#### 4. Presentation Creation
```typescript
// Create a presentation from stored credentials
POST /api/vc/present
Request: {
  holderDid: string, // User's DID
  credentials: [credentialJwt],
  audience: string, // Verifier DID
  challenge: string // From verification request
}
Response: { data: { presentationJwt, verifiableCredential } }
```

**Use Case**: Respond to verifier's presentation requests

#### 5. Verification Request Handling
```typescript
// Receive presentation request (via QR/deep link)
GET /api/verifier/request/:requestId
Response: { data: { requestedCredentials, purpose, expiresAt } }
```

**Use Case**: User sees what credentials are being requested

---

## Wallet Screens Implementation Plan

### Screen 1: Welcome/Setup
```typescript
// components/WelcomeScreen.tsx
Location: apps/wallet-frontend/src/screens/WelcomeScreen.tsx

UI Elements:
- Logo & branding
- "Create Wallet" button → calls POST /api/did
- "Restore Wallet" button (future)
- Terms & conditions

Flow:
1. User taps "Create Wallet"
2. POST /api/did to create new DID
3. Store DID + credentials locally (SecureStore)
4. Navigate to CredentialList

Storage:
- DID → @react-native-async-storage
- Private keys → expo-secure-store (encrypted)
```

### Screen 2: Credential List
```typescript
// components/CredentialListScreen.tsx
Location: apps/wallet-frontend/src/screens/CredentialListScreen.tsx

UI Elements:
- FlatList of stored credentials
- Card per credential:
  - Credential name/type
  - Issuer name
  - Issue date
  - Status (valid/expired/revoked)
- FAB button for "Add Credential" (scan QR)
- Settings button

Data Model:
interface StoredCredential {
  id: string;
  jwt: string;
  templateName: string;
  issuerDid: string;
  claims: Record<string, any>;
  issuedAt: Date;
  verificationResult: VerificationResult;
}

Storage:
- Credentials stored in AsyncStorage (encrypted at rest)
- Verification results cached
```

### Screen 3: Credential Details
```typescript
// components/CredentialDetailScreen.tsx
Location: apps/wallet-frontend/src/screens/CredentialDetailScreen.tsx

UI Elements:
- Full credential information display
- Claim values in readable format
- Issuer information
- Signature verification status
- Delete credential button
- Share button (future)

Data Display:
- Template type
- All claims (firstName, lastName, etc.)
- Issue date & expiry
- Issuer DID (with copy button)
- Verification status indicator
```

### Screen 4: Presentation Request Handler
```typescript
// components/PresentationRequestScreen.tsx
Location: apps/wallet-frontend/src/screens/PresentationRequestScreen.tsx

Flow:
1. User scans QR code → gets requestId
2. GET /api/verifier/request/:requestId
3. Display requested credentials:
   - "Verifier X is requesting:"
   - List of required credential types
   - Purpose of request
   - "Allow" / "Deny" buttons

On Allow:
1. User selects which credential to share
2. POST /api/vc/present with selected credential
3. Generate presentation JWT
4. Submit to verifier
5. Show success/confirmation

On Deny:
- Don't send presentation
- Return to credential list
```

### Screen 5: Settings
```typescript
// components/SettingsScreen.tsx
Location: apps/wallet-frontend/src/screens/SettingsScreen.tsx

UI Elements:
- Display wallet DID (copy to clipboard)
- Show number of credentials
- Backup wallet (export credentials)
- Export private key (with warning)
- About section
- Privacy policy
- Terms of service
```

---

## Local Storage Schema

### AsyncStorage Keys
```typescript
// Credentials storage
const CREDENTIALS_KEY = "@kyc_vault/credentials";
interface StorageCredential {
  id: string;
  jwt: string;
  templateName: string;
  issuerDid: string;
  claims: Record<string, any>;
  issuedAt: number;
  verified: boolean;
  verificationPayload: any;
}

// Wallet identity
const WALLET_DID_KEY = "@kyc_vault/wallet_did";
const WALLET_ALIAS_KEY = "@kyc_vault/wallet_alias";

// Verification results cache
const VERIFICATION_CACHE_KEY = "@kyc_vault/verification_cache";

// Settings
const SETTINGS_KEY = "@kyc_vault/settings";
interface WalletSettings {
  theme: "light" | "dark";
  notificationsEnabled: boolean;
  autoVerifyCredentials: boolean;
}
```

### Secure Storage (expo-secure-store)
```typescript
// Private key storage (NEVER in AsyncStorage)
const PRIVATE_KEY_STORE_KEY = "wallet_private_key_encrypted";

// Seeds for key derivation
const SEED_KEY = "wallet_seed";
```

---

## API Integration Service

Create a centralized API service:

```typescript
// services/api.ts
Location: apps/wallet-frontend/src/services/api.ts

export class KYCVaultAPI {
  private baseURL = process.env.API_BASE_URL || "http://localhost:3001";

  async createDID(): Promise<DIDs> {
    const response = await fetch(`${this.baseURL}/api/did`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ didMethod: "did:key" })
    });
    return response.json();
  }

  async verifyCredential(jwtString: string): Promise<VerificationResult> {
    const response = await fetch(`${this.baseURL}/api/vc/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ credential: jwtString })
    });
    return response.json();
  }

  async createPresentation(
    holderDid: string,
    credentials: string[],
    audience: string,
    challenge: string
  ): Promise<PresentationResponse> {
    const response = await fetch(`${this.baseURL}/api/vc/present`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        holderDid,
        credentials,
        audience,
        challenge
      })
    });
    return response.json();
  }

  async getVerificationRequest(requestId: string): Promise<VerificationRequest> {
    const response = await fetch(
      `${this.baseURL}/api/verifier/request/${requestId}`
    );
    return response.json();
  }
}
```

---

## State Management (Redux Toolkit Pattern)

```typescript
// store/slices/walletSlice.ts
Location: apps/wallet-frontend/src/store/walletSlice.ts

interface WalletState {
  did: string | null;
  alias: string | null;
  isInitialized: boolean;
  credentials: StoredCredential[];
  loading: boolean;
  error: string | null;
}

const walletSlice = createSlice({
  name: "wallet",
  initialState,
  reducers: {
    setDID(state, action) { state.did = action.payload; },
    addCredential(state, action) { state.credentials.push(action.payload); },
    removeCredential(state, action) {
      state.credentials = state.credentials.filter(
        c => c.id !== action.payload
      );
    },
    setInitialized(state) { state.isInitialized = true; },
  }
});

// store/slices/presentationSlice.ts
interface PresentationState {
  currentRequest: VerificationRequest | null;
  selectedCredentials: string[];
  submitting: boolean;
  result: PresentationResult | null;
}
```

---

## QR Code Integration

```typescript
// services/qrCodeHandler.ts
Location: apps/wallet-frontend/src/services/qrCodeHandler.ts

export async function handleQRCode(qrData: string) {
  // Format: kyc-vault://verify?requestId=<uuid>
  // or: https://kyc-vault.app/verify?requestId=<uuid>

  const url = new URL(qrData);
  const requestId = url.searchParams.get("requestId");

  if (!requestId) {
    throw new Error("Invalid QR code format");
  }

  // Fetch verification request
  const request = await api.getVerificationRequest(requestId);
  
  // Store and navigate to presentation screen
  store.dispatch(setPresentationRequest(request));
  navigation.navigate("PresentationRequest", { requestId });
}
```

---

## Security Considerations

### 1. Private Key Management
```typescript
// SECURE: Use expo-secure-store
import * as SecureStore from "expo-secure-store";

export async function storePrivateKey(key: string) {
  await SecureStore.setItemAsync("wallet_private_key", key);
}

export async function retrievePrivateKey() {
  return await SecureStore.getItemAsync("wallet_private_key");
}

// NEVER store in AsyncStorage
// NEVER log private keys
// NEVER transmit over unencrypted channels
```

### 2. Credential Verification
```typescript
// Always verify credentials before storing
async function storeCredential(jwtString: string) {
  const verification = await api.verifyCredential(jwtString);
  
  if (!verification.data.verified) {
    throw new Error("Credential verification failed");
  }

  // Only store if verified
  const credential: StoredCredential = {
    jwt: jwtString,
    verificationResult: verification.data,
    // ... other fields
  };

  await storeInAsyncStorage(credential);
}
```

### 3. Deep Link Security
```typescript
// Handle deep links securely
import * as Linking from "expo-linking";

const linking = {
  prefixes: ["kyc-vault://", "https://kyc-vault.app"],
  config: {
    screens: {
      PresentationRequest: "verify/:requestId",
      // Whitelist only specific routes
    }
  }
};

// Validate all parameters
function validateDeepLink(url: URL) {
  const requestId = url.searchParams.get("requestId");
  if (!requestId || !isValidUUID(requestId)) {
    throw new Error("Invalid request ID");
  }
}
```

---

## Testing Strategy

### Unit Tests
```typescript
// __tests__/api.test.ts
import { KYCVaultAPI } from "../services/api";

describe("KYCVaultAPI", () => {
  let api: KYCVaultAPI;

  beforeEach(() => {
    api = new KYCVaultAPI();
  });

  test("createDID returns valid DID", async () => {
    const result = await api.createDID();
    expect(result.data.did).toMatch(/^did:key:.+/);
  });

  test("verifyCredential validates JWT", async () => {
    const jwt = "..."; // test JWT
    const result = await api.verifyCredential(jwt);
    expect(result.data.verified).toBe(true);
  });
});
```

### Integration Tests
```typescript
// __tests__/integration/credentialFlow.test.ts
describe("Credential Flow", () => {
  test("complete flow: create DID -> receive credential -> verify", async () => {
    // 1. Create wallet DID
    const did = await api.createDID();

    // 2. Simulate credential issuance
    const credential = await api.issueCredential(did, {...});

    // 3. Verify credential
    const verification = await api.verifyCredential(credential);
    expect(verification.data.verified).toBe(true);

    // 4. Store credential
    await walletStore.addCredential(credential);
    expect(walletStore.credentials).toHaveLength(1);
  });
});
```

---

## Performance Optimization

### Code Splitting
```typescript
// Navigation stack with lazy loading
const CredentialListScreen = lazy(
  () => import("./screens/CredentialListScreen")
);
const CredentialDetailScreen = lazy(
  () => import("./screens/CredentialDetailScreen")
);
```

### Credential Caching
```typescript
// Cache verification results to avoid repeated API calls
const verificationCache = new Map<string, CachedVerification>();

async function verifyCredentialCached(jwt: string) {
  if (verificationCache.has(jwt)) {
    return verificationCache.get(jwt);
  }

  const result = await api.verifyCredential(jwt);
  verificationCache.set(jwt, result);
  return result;
}
```

### Image Optimization
```typescript
// Use Expo's Image component with caching
import { Image } from "expo-image";

<Image
  source={{ uri: issuerLogo }}
  contentFit="cover"
  cachePolicy="memory-disk"
/>
```

---

## Environment Configuration

Create `.env.local` for development:
```env
API_BASE_URL=http://localhost:3001
API_TIMEOUT=30000
LOG_LEVEL=debug
ENABLE_MOCK_DATA=false
```

Production `.env.production`:
```env
API_BASE_URL=https://api.kyc-vault.prod
API_TIMEOUT=30000
LOG_LEVEL=error
ENABLE_MOCK_DATA=false
```

---

## Deployment Checklist

- [ ] All screens implemented
- [ ] API integration complete
- [ ] Local storage tested
- [ ] Deep linking working
- [ ] QR code scanning working
- [ ] Error handling implemented
- [ ] Loading states visible
- [ ] Offline mode considered
- [ ] Security audit passed
- [ ] Performance optimized
- [ ] Build release APK/IPA
- [ ] App store submission prepared

---

## Quick Start Commands

```bash
# Install dependencies
cd apps/wallet-frontend
pnpm install

# Run on iOS
expo run:ios

# Run on Android
expo run:android

# Run on web
expo start --web

# Build release
eas build --platform ios
eas build --platform android
```

---

**Happy coding!** 🚀

For questions or issues, refer to the main [SYSTEM_VALIDATION_REPORT.md](./SYSTEM_VALIDATION_REPORT.md)
