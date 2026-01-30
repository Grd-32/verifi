# Wallet Frontend - Developer Quick Reference

## Quick Start - Common Tasks

### 1. Making an API Call with Error Handling

```typescript
import { api } from "../services/api";
import toastService from "../services/toastService";

const handleCreateDID = async () => {
  try {
    const did = await api.createDID();
    toastService.success("Success", "DID created successfully");
    // Use the DID...
  } catch (error) {
    // Error handling is automatic - toast is shown
    console.error(error);
  }
};
```

### 2. Using useAsync Hook for Complex Async Operations

```typescript
import { useAsync } from "../hooks";

function MyComponent() {
  const { loading, error, execute } = useAsync(
    async () => {
      return await api.issueCredential(...);
    },
    true // showToast
  );

  const handleSubmit = async () => {
    await execute(
      (credential) => {
        console.log("Success:", credential);
      },
      (error) => {
        console.error("Failed:", error);
      }
    );
  };

  return (
    <TouchableOpacity onPress={handleSubmit} disabled={loading}>
      <Text>{loading ? "Loading..." : "Submit"}</Text>
    </TouchableOpacity>
  );
}
```

### 3. Form Validation

```typescript
import { useFormValidation } from "../hooks";
import { ErrorHandler } from "../services/errorHandler";

function KYCForm() {
  const { values, errors, handleChange, validate } = useFormValidation({
    name: "",
    email: "",
    phone: "",
  });

  const handleSubmit = () => {
    const isValid = validate({
      name: (v) => v.trim() ? null : "Name is required",
      email: (v) => ErrorHandler.validateEmail(v).error || null,
      phone: (v) => ErrorHandler.validateFormField(v, "Phone", {
        pattern: /^\+?[\d\s\-()]+$/
      }).error || null,
    });

    if (isValid) {
      // Submit form...
    }
  };

  return (
    <View>
      <TextInput
        value={values.name}
        onChangeText={(text) => handleChange("name", text)}
        placeholder="Full Name"
      />
      {errors.name && <Text style={{ color: "red" }}>{errors.name}</Text>}
      {/* More fields... */}
    </View>
  );
}
```

### 4. Showing Notifications

```typescript
import toastService from "../services/toastService";

// Success notification
toastService.success("Operation Successful", "Your data has been saved");

// Error notification
toastService.error("Operation Failed", "Please check your input");

// Confirmation dialog
toastService.confirm(
  "Confirm Delete",
  "This action cannot be undone",
  () => {
    // Handle delete
  },
  () => {
    // Handle cancel
  },
  "Delete",
  "Cancel"
);

// Destructive action confirmation
toastService.confirmDestructive(
  "Delete Account",
  "Are you sure? This will delete all your data.",
  () => {
    // Handle delete
  },
  undefined,
  "Delete Account"
);
```

### 5. Storing and Retrieving Data

```typescript
import { credentialStorage, kycSessionStorage, walletIdentityStorage } from "../services/storage";

// Store credential
await credentialStorage.addCredential({
  id: "cred_123",
  jwt: "eyJ0eXAi...",
  // ... other fields
});

// Get all credentials
const creds = await credentialStorage.getAllCredentials();

// Get specific credential
const cred = await credentialStorage.getCredential("cred_123");

// Update credential
await credentialStorage.updateCredential("cred_123", { verified: true });

// Delete credential
await credentialStorage.deleteCredential("cred_123");

// KYC Session management
await kycSessionStorage.startSession({
  kycId: "kyc_123",
  walletDid: "did:key:...",
  applicantName: "John Doe",
  applicantEmail: "john@example.com",
  startedAt: Date.now(),
});

// Update KYC progress
await kycSessionStorage.updateSession("kyc_123", {
  documentsUploaded: ["passport", "selfie"],
  verificationStarted: true,
});

// Wallet identity
await walletIdentityStorage.setDID("did:key:...");
const walletDid = await walletIdentityStorage.getDID();
```

### 6. Error Handling Patterns

```typescript
import { ErrorHandler } from "../services/errorHandler";

// Pattern 1: Catch and handle
try {
  await api.issueCredential(...);
} catch (error) {
  const userMessage = ErrorHandler.getUserMessage(error);
  Alert.alert("Error", userMessage);
}

// Pattern 2: Validate before submitting
const validation = ErrorHandler.validateEmail(email);
if (!validation.valid) {
  setError(validation.error);
}

// Pattern 3: Validate entire credential
const credentialData = {
  id: "...",
  jwt: "...",
  issuedAt: Date.now(),
};
const { valid, errors } = ErrorHandler.validateCredential(credentialData);
if (!valid) {
  console.error("Invalid credential:", errors);
}

// Pattern 4: Log errors with context
try {
  await someOperation();
} catch (error) {
  ErrorHandler.logError(error, "KYC Verification");
}
```

### 7. Working with Zustand Stores

```typescript
import { useWalletStore, usePresentationStore } from "../store";

function CredentialComponent() {
  // Wallet store
  const { did, credentials, addCredential, setLoading } = useWalletStore();

  // Presentation store
  const { selectedCredentials, setSelectedCredentials } = usePresentationStore();

  const handleSelectCredential = (credId: string) => {
    if (selectedCredentials.includes(credId)) {
      setSelectedCredentials(
        selectedCredentials.filter((id) => id !== credId)
      );
    } else {
      setSelectedCredentials([...selectedCredentials, credId]);
    }
  };

  return (
    <View>
      <Text>Your DID: {did}</Text>
      <Text>Credentials: {credentials.length}</Text>
      {/* ... */}
    </View>
  );
}
```

### 8. API Service Selection

The API service automatically routes to the correct microservice:

```typescript
// These go to Veramo Agent (3001)
await api.createDID();
await api.verifyCredential(jwt);
await api.createPresentation(...);

// These go to Issuer Service (3002)
await api.issueCredential(...);
await api.getCredentialTemplates(issuerDid);
await api.revokeCredential(...);

// These go to Verifier Service (3003)
await api.createPresentationRequest(...);
await api.verifyPresentation(...);
await api.getVerificationResult(requestId);

// These go to API Gateway (5000)
await api.initiateKYC(...);
await api.uploadDocument(...);
await api.getKYCStatus(kycId);
```

## Debugging Tips

### Enable API Logging

Add to your component:

```typescript
useEffect(() => {
  console.log("[API] Creating DID for wallet");
  // This will log all API calls to the console
}, []);
```

### Check Storage Contents

```typescript
import { credentialStorage, walletIdentityStorage } from "../services/storage";

// View all stored data
const credentials = await credentialStorage.getAllCredentials();
const did = await walletIdentityStorage.getDID();
console.log("Stored credentials:", credentials);
console.log("Wallet DID:", did);
```

### Monitor Error Types

```typescript
import { ErrorHandler } from "../services/errorHandler";

try {
  // Your operation
} catch (error) {
  const appError = ErrorHandler.handle(error);
  console.log("Error Code:", appError.code);           // e.g., "NOT_FOUND"
  console.log("User Message:", appError.userMessage);   // User-friendly
  console.log("Technical:", appError.message);          // Technical details
}
```

## Common Patterns

### Pattern: Credential Verification Flow

```typescript
async function verifyAndStoreCredential(credentialJwt: string) {
  try {
    // 1. Verify the credential
    const result = await api.verifyCredential(credentialJwt);
    
    // 2. Show success
    toastService.success("Credential Verified", "Your credential is valid");
    
    // 3. Extract claims
    const claims = extractClaimsFromCredential(credentialJwt);
    
    // 4. Store in wallet
    const credentialData = {
      id: generateId(),
      jwt: credentialJwt,
      verified: true,
      verificationPayload: result,
      claims,
      // ... other fields
    };
    
    await credentialStorage.addCredential(credentialData);
    
    // 5. Update store
    addCredential(credentialData);
    
  } catch (error) {
    const message = ErrorHandler.getUserMessage(error);
    toastService.error("Verification Failed", message);
  }
}
```

### Pattern: Async Form Submission

```typescript
const [submitting, setSubmitting] = useState(false);
const [errors, setErrors] = useState<Record<string, string>>({});

async function handleSubmit() {
  setSubmitting(true);
  setErrors({});

  try {
    // Validate
    const validation = validateForm(formData);
    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }

    // Submit
    const result = await api.issueCredential(...);

    // Success
    toastService.success("Success", "Credential issued");
    navigation.navigate("CredentialDetail", { id: result.id });
    
  } catch (error) {
    const message = ErrorHandler.getUserMessage(error);
    toastService.error("Error", message);
  } finally {
    setSubmitting(false);
  }
}
```

## Performance Best Practices

1. **Use useFocusEffect for async data loading:**
   ```typescript
   useFocusEffect(
     useCallback(() => {
       loadCredentials();
     }, [])
   );
   ```

2. **Cache credential data:**
   ```typescript
   const credentials = useMemo(
     () => walletStore.credentials,
     [walletStore.credentials]
   );
   ```

3. **Debounce search inputs:**
   ```typescript
   const debouncedSearch = useDebounce(searchTerm, 300);
   ```

4. **Cancel requests on unmount:**
   ```typescript
   const request = useRef<CancelToken>();
   
   useEffect(() => {
     return () => {
       request.current?.cancel("Component unmounted");
     };
   }, []);
   ```

## Security Best Practices

1. Never log sensitive data:
   ```typescript
   // ❌ BAD
   console.log("Private key:", privateKey);
   
   // ✅ GOOD
   console.log("Key length:", privateKey.length);
   ```

2. Validate all inputs before submission

3. Use ErrorHandler for sanitized error messages

4. Clear sensitive data on logout:
   ```typescript
   await walletIdentityStorage.clearWallet();
   await credentialStorage.clearAllCredentials();
   ```

5. Check credential expiration:
   ```typescript
   const expired = isExpired(credential.issuedAt);
   ```

## Troubleshooting

### API returns 404
- Check service URL configuration in env vars
- Verify microservice is running on expected port
- Check endpoint path in service controller

### Credentials not persisting
- Check AsyncStorage permissions
- Verify credentialStorage.addCredential() is called
- Clear app cache and retry

### Validation not working
- Ensure validate() method is called with rules
- Check error state is properly displayed
- Verify field names match storage keys

### Toast not showing
- Ensure toastService is imported correctly
- Check Alert is not already showing
- Verify function is called synchronously before navigation
