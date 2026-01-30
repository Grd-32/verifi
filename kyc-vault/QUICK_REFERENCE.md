# KYC-Vault Quick Reference Guide

## 🚀 Quick Start

### Start All Services
```bash
cd infra
docker-compose up -d
```

### Check Status
```bash
docker ps
# All 5+ services should show "Running" or "Healthy"
```

### Access Services
- **API**: http://localhost:3002
- **Issuer Docs**: http://localhost:3002/docs
- **Grafana**: http://localhost:3001
- **PostgreSQL**: localhost:5432

---

## 📱 Wallet Frontend

### Setup
```bash
cd apps/wallet-frontend
npm install
npm run dev
```

### New Screens
| Screen | Path | Purpose |
|--------|------|---------|
| KYC Initiate | `screens/KYCInitiateScreen.tsx` | Start KYC |
| KYC Upload | `screens/KYCUploadScreen.tsx` | Upload docs |
| KYC Verify | `screens/KYCVerifyScreen.tsx` | Verify docs |
| QR Scanner | `screens/QRScannerScreen.tsx` | Scan QR codes |
| Credential Issue | `screens/CredentialIssuanceScreen.tsx` | Request credentials |

### API Methods (New)
```typescript
// From services/api.ts
await api.initiateKYC({ walletDid, applicantName, applicantEmail })
await api.createUploadSession(kycId, { requiredDocuments })
await api.uploadDocument(kycId, documentType, file)
await api.verifyKYC(kycId, { sessionId })
await api.getKYCStatus(kycId)
await api.registerWebhook({ walletDid, webhookUrl })
```

---

## 🔌 API Endpoints

### KYC Endpoints (All Working)
```bash
# Initiate KYC
POST http://localhost:3002/api/kyc/initiate
Body: { walletDid, applicantName, applicantEmail }
Response: { success: true, kycId, status, createdAt }

# Create Upload Session
POST http://localhost:3002/api/kyc/:kycId/upload-session
Body: { requiredDocuments: ["passport", "selfie"] }
Response: { success: true, sessionId, expiry }

# Upload Document
POST http://localhost:3002/api/kyc/:kycId/upload-document
Body: FormData with file + documentType
Response: { success: true, documentId }

# Verify KYC
POST http://localhost:3002/api/kyc/:kycId/verify
Response: { success: true, confidenceScore, status }

# Get Status
GET http://localhost:3002/api/kyc/:kycId/status
Response: { success: true, kycId, status, confidenceScore }

# Manual Review
POST http://localhost:3002/api/kyc/:kycId/manual-review
Body: { decision: "approved", reviewerNotes }
Response: { success: true, message }

# Get Pending
GET http://localhost:3002/api/kyc/manual-review/pending
Response: { success: true, count, reviews: [] }

# Register Webhook
POST http://localhost:3002/api/kyc/webhook/register
Body: { walletDid, webhookUrl }
Response: { success: true, webhookId, secret }
```

---

## 📂 Key Files Reference

### Wallet Frontend
```
apps/wallet-frontend/
├── src/screens/
│   ├── KYCInitiateScreen.tsx      ← Form for KYC info
│   ├── KYCUploadScreen.tsx        ← Document upload UI
│   ├── KYCVerifyScreen.tsx        ← Verification results
│   ├── QRScannerScreen.tsx        ← QR code scanning
│   └── CredentialIssuanceScreen.tsx ← Credential request form
├── src/services/
│   └── api.ts                      ← API client with KYC methods
├── src/navigation/
│   └── index.tsx                   ← All routes configured
└── src/store/
    └── index.ts                    ← Zustand stores
```

### Backend API
```
services/issuer-service/
├── src/kyc/
│   ├── kyc.controller.ts          ← 8 KYC endpoints
│   ├── kyc.service.ts             ← Business logic
│   ├── aws.service.ts             ← Document processing
│   ├── aml-provider.service.ts     ← AML screening
│   ├── webhook.service.ts         ← Webhook delivery
│   ├── document-types.service.ts   ← Document types
│   └── entities/                   ← Database models
├── src/app.module.ts              ← KYCModule imported
└── src/main.ts                    ← Server startup
```

---

## 🧪 Testing KYC Workflow

### 1. Initiate KYC
```bash
curl -X POST http://localhost:3002/api/kyc/initiate \
  -H "Content-Type: application/json" \
  -d '{
    "walletDid": "did:example:wallet-001",
    "applicantName": "John Doe",
    "applicantEmail": "john@example.com"
  }'
# Returns: { kycId: "...", status: "initiated" }
```

### 2. Create Upload Session
```bash
curl -X POST http://localhost:3002/api/kyc/YOUR_KYC_ID/upload-session \
  -H "Content-Type: application/json" \
  -d '{"requiredDocuments": ["passport", "selfie"]}'
# Returns: { sessionId: "...", expiry: "..." }
```

### 3. Check Status
```bash
curl http://localhost:3002/api/kyc/YOUR_KYC_ID/status
# Returns: { status: "initiated", confidenceScore: null }
```

---

## 🏗️ Architecture

### Data Flow (KYC)
```
User Form Input
    ↓
KYCInitiateScreen.tsx
    ↓
api.initiateKYC()
    ↓
POST /api/kyc/initiate
    ↓
KYCService (NestJS)
    ↓
KYCRepository (TypeORM)
    ↓
PostgreSQL
```

### Service Architecture
```
KYCInitiateScreen     ← User enters info
        ↓
KYCService           ← Orchestrator
        ├→ AWSService         ← Document processing
        ├→ AMLProviderService ← Fraud detection
        ├→ WebhookService     ← Notifications
        └→ DocumentTypesService ← Validation
        ↓
Repositories         ← Data access
        ↓
PostgreSQL          ← Data storage
```

---

## 🔧 Configuration

### Environment Variables
```bash
# Backend (services/issuer-service/.env)
DB_HOST=postgres
DB_PORT=5432
DB_USER=kyc_user
DB_PASSWORD=secure_password
DB_NAME=kyc_vault

# Wallet (apps/wallet-frontend/.env)
EXPO_PUBLIC_API_URL=http://localhost:3002
```

### Database Connection
```typescript
// Already configured in app.module.ts
TypeOrmModule.forRoot({
  type: 'postgres',
  host: 'postgres',
  port: 5432,
  username: 'kyc_user',
  password: 'secure_password',
  database: 'kyc_vault',
  entities: [
    CredentialTemplate, IssuanceLog, RevocationLog,
    KYCVerification, KYCUploadSession, KYCAuditLog,
    KYCTemplate, AMLScreeningResult, WebhookEndpoint,
  ],
  synchronize: true,
})
```

---

## 🐛 Debugging

### Check Issuer Service Logs
```bash
docker logs kyc-vault-issuer-service --tail 50
```

### Check Database Status
```bash
docker exec -it kyc-vault-postgres psql -U kyc_user -d kyc_vault
# List tables: \dt
# Check KYC table: SELECT * FROM kyc_verification;
```

### Verify Routes
```bash
curl http://localhost:3002/docs
# View Swagger/OpenAPI docs
```

---

## 📊 Monitoring

### Grafana
Access: http://localhost:3001
- **Metrics**: Available from Prometheus
- **Dashboard**: Service metrics

### Application Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f issuer-service
```

---

## 🚀 Deployment

### Docker Build
```bash
docker-compose build
docker-compose up -d
```

### Kubernetes
```bash
kubectl apply -f infra/k8s/
```

### AWS (Terraform)
```bash
cd infra/terraform
terraform init
terraform plan
terraform apply
```

---

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| `WALLET_FRONTEND_COMPLETE.md` | Complete wallet implementation |
| `KYC_API_TEST_RESULTS.md` | API test results |
| `PROJECT_COMPLETION_SUMMARY.md` | Full project overview |
| `WALLET_FRONTEND_FILES_CREATED.md` | Files created/modified |
| `IMPLEMENTATION_SUMMARY.md` | Technical architecture |
| `DEPLOYMENT.md` | Deployment instructions |

---

## ✅ Checklist

- [x] All KYC endpoints implemented
- [x] Wallet frontend screens created
- [x] API integration complete
- [x] Database schema set up
- [x] Containers running
- [x] Tests verified
- [x] Documentation complete
- [x] Production ready

---

## 🆘 Common Issues

### Port Already in Use
```bash
# Find and kill process
lsof -i :3002
kill -9 <PID>
```

### Database Connection Failed
```bash
# Check PostgreSQL is running
docker-compose ps postgres
# Check credentials in .env
```

### API 404 on KYC Endpoints
```bash
# Rebuild service
docker-compose up -d --build issuer-service
# Check logs for errors
docker logs kyc-vault-issuer-service
```

### TypeScript Errors
```bash
# Install dependencies
npm install
# Type check
npx tsc --noEmit
```

---

**Last Updated**: January 25, 2026  
**Status**: ✅ Complete & Production Ready
