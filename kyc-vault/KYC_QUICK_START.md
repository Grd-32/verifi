# KYC Service Quick Start

## 5-Minute Setup

### 1. AWS Setup (One Time)

Follow the instructions in `infra/AWS_KYC_SETUP.md`:

```bash
# Create S3 bucket
aws s3 mb s3://kyc-vault-documents --region us-east-1

# Create IAM user with access keys
# Save the Access Key ID and Secret Access Key
```

### 2. Environment Configuration

Create `.env` file in `services/issuer-service`:

```bash
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_key_here
AWS_SECRET_ACCESS_KEY=your_secret_here
S3_KYC_BUCKET=kyc-vault-documents
DATABASE_URL=postgres://kyc-admin:kyc-password@postgres:5432/issuer-db
```

### 3. Database Setup

```bash
# In postgres
psql -h localhost -U kyc-admin -d issuer-db < infra/kyc-schema.sql

# Or run migrations if using Nest TypeORM
npm run migration:run
```

### 4. Install & Run

```bash
cd services/issuer-service
pnpm install
pnpm dev
```

## Test API Endpoints

### 1. Initiate KYC

```bash
curl -X POST http://localhost:3002/api/kyc/initiate \
  -H "Content-Type: application/json" \
  -d '{
    "applicantDid": "did:ion:EiDx7JuXA...",
    "email": "user@example.com"
  }'
```

**Response:**
```json
{
  "id": "uuid-kyc-id",
  "status": "pending",
  "message": "KYC verification initiated"
}
```

### 2. Upload ID Document

```bash
curl -X POST http://localhost:3002/api/kyc/{kyc-id}/upload-document \
  -F "document=@path/to/id.jpg" \
  -F "documentType=id_document"
```

### 3. Upload Selfie

```bash
curl -X POST http://localhost:3002/api/kyc/{kyc-id}/upload-document \
  -F "document=@path/to/selfie.jpg" \
  -F "documentType=selfie"
```

### 4. Verify KYC

```bash
curl -X POST http://localhost:3002/api/kyc/{kyc-id}/verify
```

**Response:**
```json
{
  "id": "kyc-id",
  "status": "verified",
  "finalVerificationStatus": "approved",
  "verificationConfidence": 0.98,
  "extractedName": "John Doe",
  "facialMatch": 0.95,
  "livenessScore": 0.92,
  "amlStatus": "clear"
}
```

### 5. Check Status

```bash
curl http://localhost:3002/api/kyc/{kyc-id}/status
```

## File Structure

```
services/issuer-service/src/kyc/
├── controllers/
│   └── kyc.controller.ts          # REST endpoints
├── services/
│   ├── kyc.service.ts             # Main orchestration
│   ├── aws.service.ts             # AWS SDK integration
│   ├── document-processing.service.ts  # OCR & facial recognition
│   └── aml-screening.service.ts   # Sanctions screening
├── entities/
│   ├── kyc-verification.entity.ts
│   ├── kyc-upload-session.entity.ts
│   ├── kyc-audit-log.entity.ts
│   ├── kyc-template.entity.ts
│   └── aml-screening-result.entity.ts
└── kyc.module.ts                  # Module definition
```

## Common Issues

### Issue: AWS Credentials Not Found
```bash
# Check credentials are in .env
cat services/issuer-service/.env | grep AWS

# Or set as environment variables
export AWS_ACCESS_KEY_ID=...
export AWS_SECRET_ACCESS_KEY=...
```

### Issue: S3 Bucket Not Found
```bash
# Check bucket exists
aws s3 ls --region us-east-1 | grep kyc-vault-documents

# Check credentials have S3 permissions
aws s3 ls s3://kyc-vault-documents
```

### Issue: Textract/Rekognition API Errors
```bash
# Check service is available in your region
aws textract list-document-analysis-jobs --region us-east-1

# Check IAM policy includes these services
aws iam get-user-policy --user-name kyc-vault-service-user --policy-name kyc-vault-service-policy
```

### Issue: Database Connection Error
```bash
# Check PostgreSQL is running
psql -h localhost -U kyc-admin -d issuer-db -c "SELECT 1"

# Check TypeORM connection string
echo $DATABASE_URL
```

## Development Tips

### Enable Debug Logging

```bash
# In terminal
export DEBUG=kyc:*

# Or in .env
DEBUG=kyc:*
```

### Test with Sample Images

```bash
# Download sample ID images from:
# https://tesseract.projectnaptha.com/

# Or use your own test documents
```

### Monitor AWS Costs

```bash
# Check current usage
aws ce get-cost-and-usage \
  --time-period Start=2024-01-01,End=2024-01-31 \
  --granularity MONTHLY \
  --metrics "UnblendedCost" \
  --group-by Type=DIMENSION,Key=SERVICE

# Set up billing alerts
aws ce put-anomaly-monitor \
  --anomaly-monitor AnomalyMonitor={MonitorName=kyc-spending,MonitorType=DIMENSIONAL}
```

## Next Steps

1. **Create Web UI** for document upload (see `web/` directory)
2. **Integrate with Credential Issuance** (issuer-service)
3. **Add Webhook Callbacks** to wallet app
4. **Set up Manual Review Workflow** for borderline cases
5. **Configure AML Provider** (OFAC, Sanction Scanner, etc.)

## Support

For issues or questions:
- Check `KYC_SERVICE_SUMMARY.md` for detailed docs
- Review AWS service documentation
- Check application logs: `docker logs issuer-service`

## Cost Calculator

Estimate your monthly KYC costs:

```
Number of KYCs per month: _____

Textract (OCR): _____ KYCs × 1 document × $0.015 = $_____
Rekognition (Facial): _____ KYCs × 2 images × $0.001 = $_____
S3 Storage: _____ KYCs × 2MB × $0.023/GB / 1000 = $_____

TOTAL MONTHLY: $_____
COST PER KYC: $_____ / _____ = $______
```

For 10,000 KYCs/month: ~$180 total, ~$0.018 per KYC
