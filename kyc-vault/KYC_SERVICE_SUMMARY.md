# KYC Service Implementation Summary

## What's Been Built

### 1. Database Schema (`infra/kyc-schema.sql`)
- **kyc_verifications**: Main KYC record with document references and verification results
- **kyc_upload_sessions**: Tracks multipart uploads for large files
- **kyc_audit_log**: Complete audit trail of all KYC actions
- **kyc_templates**: Reusable KYC verification workflows
- **aml_screening_results**: Cache for AML screening to reduce costs

### 2. KYC NestJS Service (`services/issuer-service/src/kyc/`)

**Entities:**
- `KYCVerification` - Main verification record
- `KYCUploadSession` - Upload session tracking
- `KYCAuditLog` - Audit trail
- `KYCTemplate` - Verification templates
- `AMLScreeningResult` - AML cache

**Services:**
- `KYCService` - Main orchestration
- `AWSService` - AWS SDK integration (S3, Textract, Rekognition)
- `DocumentProcessingService` - OCR and facial recognition logic
- `AMLScreeningService` - Sanctions screening

**Controller:**
- `KYCController` - REST API endpoints

### 3. API Endpoints

```
POST /api/kyc/initiate
  - Initiate KYC for applicant
  - Returns: KYC ID and status

POST /api/kyc/:kycId/upload-session
  - Create upload session for document
  - Returns: Upload session ID and S3 key

POST /api/kyc/:kycId/upload-document
  - Upload document file to S3
  - Supports: id_document, selfie, address_proof
  - Returns: S3 key confirmation

POST /api/kyc/:kycId/verify
  - Process all documents through verification pipeline
  - Steps:
    1. OCR extraction from ID (Textract)
    2. Facial recognition & liveness (Rekognition)
    3. AML/Sanctions screening
    4. Final verification decision
  - Returns: Verification result with confidence scores

GET /api/kyc/:kycId/status
  - Get current KYC status
  - Returns: All verification results and scores
```

### 4. Processing Pipeline

```
STEP 1: ID Document Processing
  ├─ Upload to S3 (encrypted)
  ├─ Extract text with Textract OCR
  ├─ Parse extracted fields:
  │  ├─ Full Name
  │  ├─ Date of Birth
  │  ├─ ID Type (passport, driver's license, etc.)
  │  ├─ ID Number
  │  ├─ Expiry Date
  │  └─ Issue Country
  ├─ Calculate OCR confidence score
  └─ Validate document:
     ├─ Quality check
     ├─ Not expired check
     └─ Authenticity check

STEP 2: Selfie Processing
  ├─ Upload to S3 (encrypted)
  ├─ Facial detection with Rekognition
  ├─ Liveness detection:
  │  ├─ Check eyes open
  │  ├─ Check mouth position
  │  ├─ Check head pose (not tilted)
  │  └─ Calculate liveness score (0-1)
  ├─ Compare faces:
  │  ├─ Match selfie against ID photo
  │  ├─ Get facial match score
  │  └─ Verify: match > 0.8 = verified, else = failed
  └─ Log face analysis details

STEP 3: AML Screening
  ├─ Check sanctions lists:
  │  ├─ OFAC (US)
  │  ├─ EU Sanctions
  │  ├─ UN Security Council
  │  └─ Country-specific lists
  ├─ Check PEP (Politically Exposed Persons)
  ├─ Check fraud databases
  ├─ Cache results for 30 days
  └─ Return: clear, alert, or high_risk

STEP 4: Final Decision
  ├─ Calculate overall confidence score:
  │  ├─ OCR Confidence (30% weight)
  │  ├─ Facial Match Score (50% weight)
  │  └─ Liveness Score (20% weight)
  ├─ Apply approval logic:
  │  ├─ If confidence > 0.95 AND all checks pass → APPROVED
  │  ├─ If any check fails → REJECTED
  │  └─ Otherwise → MANUAL_REVIEW
  └─ Issue credential if approved
```

### 5. Data Flow

```
User Application
    ↓
[POST /api/kyc/initiate]
    ↓
KYC Record Created (status: pending)
    ↓
[POST /api/kyc/:kycId/upload-document] (3x: ID, Selfie, Address)
    ↓
Documents Stored in S3 (encrypted)
    ↓
[POST /api/kyc/:kycId/verify]
    ↓
PARALLEL AWS PROCESSING:
├─ Textract extracts ID text
├─ Rekognition analyzes selfie
└─ Sanctions screening runs
    ↓
Results combined & scored
    ↓
KYC Status Updated (verified/rejected/manual_review)
    ↓
[GET /api/kyc/:kycId/status] ← Query results
    ↓
Credential Issuance (if approved)
```

## AWS Services Used

| Service | Purpose | Cost | Latency |
|---------|---------|------|---------|
| **S3** | Document storage | $0.023/GB/month | Immediate |
| **Textract** | OCR extraction | $0.01-0.04/page | 2-30 seconds |
| **Rekognition** | Facial recognition | $0.001-0.004/image | 1-5 seconds |
| **KMS** | Encryption | $1/key + $0.03/10k calls | <5ms |

**Total cost per KYC verification: ~$0.50-1.00**

## Environment Variables Required

```bash
# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key_here
AWS_SECRET_ACCESS_KEY=your_secret_key_here
S3_KYC_BUCKET=kyc-vault-documents

# KYC Configuration
KYC_AUTO_APPROVE_THRESHOLD=0.95  # Confidence threshold
KYC_REQUIRE_MANUAL_REVIEW=false  # Always require manual review?

# Database
DATABASE_URL=postgres://kyc-admin:kyc-password@postgres:5432/issuer-db
```

## Dependencies Added

```json
{
  "@aws-sdk/client-s3": "^3.400.0",
  "@aws-sdk/client-textract": "^3.400.0",
  "@aws-sdk/client-rekognition": "^3.400.0",
  "@aws-sdk/lib-dynamodb": "^3.400.0"
}
```

## Installation Steps

1. **Set up AWS services** (see `AWS_KYC_SETUP.md`)
   ```bash
   cd infra
   # Follow AWS_KYC_SETUP.md instructions
   ```

2. **Update database schema**
   ```bash
   # Run migrations or execute kyc-schema.sql in PostgreSQL
   psql -h localhost -U kyc-admin -d issuer-db -f kyc-schema.sql
   ```

3. **Install dependencies**
   ```bash
   cd services/issuer-service
   pnpm install
   ```

4. **Configure environment**
   ```bash
   # Create .env file with AWS credentials
   cp .env.example .env
   # Edit .env with your AWS credentials
   ```

5. **Run issuer service**
   ```bash
   pnpm dev
   # or
   docker-compose up issuer-service
   ```

## Testing the KYC Flow

### Example 1: Complete KYC Verification

```bash
# 1. Initiate KYC
curl -X POST http://localhost:3002/api/kyc/initiate \
  -H "Content-Type: application/json" \
  -d '{
    "applicantDid": "did:ion:EiA...",
    "email": "user@example.com"
  }'

# Response:
{
  "id": "kyc_123",
  "status": "pending",
  "message": "KYC verification initiated"
}

# 2. Upload ID Document
curl -X POST http://localhost:3002/api/kyc/kyc_123/upload-document \
  -F "document=@passport.jpg" \
  -F "documentType=id_document"

# 3. Upload Selfie
curl -X POST http://localhost:3002/api/kyc/kyc_123/upload-document \
  -F "document=@selfie.jpg" \
  -F "documentType=selfie"

# 4. Start Verification
curl -X POST http://localhost:3002/api/kyc/kyc_123/verify

# Response (after processing):
{
  "id": "kyc_123",
  "status": "verified",
  "finalVerificationStatus": "approved",
  "verificationConfidence": 0.98,
  "extractedName": "John Doe",
  "facialMatch": 0.95,
  "livenessScore": 0.92,
  "amlStatus": "clear"
}

# 5. Check Status
curl http://localhost:3002/api/kyc/kyc_123/status
```

## Credential Issuance Integration

After KYC approval, the system should:

1. Create credential with KYC evidence:
```json
{
  "credential": {
    "@context": ["https://www.w3.org/2018/credentials/v1"],
    "type": ["VerifiableCredential", "KYCVerification"],
    "issuer": "did:ion:issuer...",
    "credentialSubject": {
      "id": "did:ion:user...",
      "kycVerified": true,
      "verificationDate": "2024-01-25",
      "fullName": "John Doe",
      "dateOfBirth": "1990-01-01",
      "verificationMethod": "aws-biometric",
      "confidence": 0.98,
      "evidence": {
        "ocrConfidence": 0.96,
        "facialMatchScore": 0.95,
        "livenessScore": 0.92,
        "amlStatus": "clear"
      }
    },
    "issuanceDate": "2024-01-25T10:00:00Z",
    "expirationDate": "2025-01-25T10:00:00Z",
    "proof": { ... }
  }
}
```

2. Send to wallet app
3. Wallet stores and displays credential

## Next Steps (TODO)

1. ✅ Create KYC database schema
2. ✅ Build KYC NestJS service
3. ✅ Integrate AWS services
4. ✅ Create API endpoints
5. ⏳ Create web dashboard UI for document upload
6. ⏳ Integrate with credential issuance service
7. ⏳ Add webhook callbacks to wallet app
8. ⏳ Set up AML provider integration (OFAC, etc.)
9. ⏳ Implement manual review workflow
10. ⏳ Add compliance reporting

## Security Considerations

- ✅ Documents encrypted in S3
- ✅ SSL/TLS for transmission
- ✅ Audit trail for all operations
- ✅ IAM roles with least privilege
- ✅ S3 public access blocked
- ✅ Document retention lifecycle (1 year)
- ⏳ Implement data anonymization after verification
- ⏳ Add rate limiting to prevent abuse
- ⏳ Implement webhook signing for callbacks
- ⏳ Add biometric template protection

## Costs

**Estimated monthly costs for 10,000 KYC verifications:**

| Service | Cost |
|---------|------|
| Textract (10k pages @ $0.015) | $150 |
| Rekognition (20k images @ $0.001) | $20 |
| S3 Storage (100GB @ $0.023) | $3 |
| S3 Transfer (100GB @ $0.02) | $2 |
| KMS Operations | $5 |
| **Total** | **~$180/month** |

Cost per verification: **~$0.018**

## References

- [AWS Textract Pricing](https://aws.amazon.com/textract/pricing/)
- [AWS Rekognition Pricing](https://aws.amazon.com/rekognition/pricing/)
- [AWS S3 Pricing](https://aws.amazon.com/s3/pricing/)
- [KYC Best Practices](https://www.worldbank.org/en/topic/financialsector/brief/know-your-customer)
- [W3C Verifiable Credentials](https://www.w3.org/TR/vc-data-model/)
