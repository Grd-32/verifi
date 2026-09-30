# KYC-VAULT ENVIRONMENT CONFIGURATION GUIDE

## Overview
This guide documents all environment variables needed for the KYC-Vault system to function properly.

## AWS Configuration

### S3 (Document Storage)
```bash
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=us-east-1
AWS_S3_BUCKET=kyc-vault-documents
AWS_S3_ENCRYPTION_KEY=your-kms-key-id  # Optional: for KMS encryption
```

### Textract (OCR)
Automatically configured with AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY

### Rekognition (Facial Recognition)
Automatically configured with AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY

## AML Provider Configuration

### Sanction Scanner Integration
```bash
SANCTION_SCANNER_API_KEY=your_sanction_scanner_key
SANCTION_SCANNER_ENDPOINT=https://api.sanctionscanner.com/v1
AML_PROVIDER=sanction-scanner
```

### OpenSanctions Integration (Alternative)
```bash
AML_PROVIDER=opensanctions
# No API key required for basic OpenSanctions
```

### OFAC Integration
```bash
OFAC_API_KEY=your_ofac_api_key
OFAC_ENDPOINT=https://ofac-api.example.com
```

## Database Configuration

### PostgreSQL
```bash
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=kyc_user
DATABASE_PASSWORD=your_secure_password
DATABASE_NAME=kyc_vault
DATABASE_SYNC=false  # Use migrations in production
```

### Redis (Optional: for caching)
```bash
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password
REDIS_DB=0
```

## Webhook Configuration

### Wallet Notification
```bash
WEBHOOK_MAX_RETRIES=3
WEBHOOK_RETRY_DELAY_MS=1000
WEBHOOK_TIMEOUT_MS=10000
WEBHOOK_SIGNING_ALGORITHM=sha256
```

### Webhook Storage
```bash
WEBHOOK_STORAGE_ENABLED=true
WEBHOOK_HISTORY_RETENTION_DAYS=30
```

## API Configuration

### Issuer Service
```bash
ISSUER_SERVICE_PORT=3001
ISSUER_SERVICE_HOST=0.0.0.0
ISSUER_API_ENDPOINT=http://issuer-service:3001
```

### Wallet App API
```bash
WALLET_API_URL=http://192.168.0.134:8080  # Update based on deployment
WALLET_API_TIMEOUT=30000
```

### API Logging
```bash
LOG_LEVEL=debug  # debug, info, warn, error
API_DOCUMENTATION_ENABLED=true
API_RATE_LIMIT_ENABLED=true
API_RATE_LIMIT_REQUESTS_PER_MINUTE=60
```

## KYC Processing Configuration

### Document Processing
```bash
MAX_FILE_SIZE_MB=10
ALLOWED_DOCUMENT_TYPES=id_document,passport,driver_license,address_proof,income_verification,employment_letter,education_certificate,bank_statement
DOCUMENT_RETENTION_DAYS=90
```

### Verification Thresholds
```bash
KYC_CONFIDENCE_THRESHOLD=0.95      # Auto-approve if confidence >= this
KYC_CONFIDENCE_REVIEW_THRESHOLD=0.70  # Manual review if < this
KYC_OCR_WEIGHT=0.3
KYC_FACIAL_WEIGHT=0.5
KYC_LIVENESS_WEIGHT=0.2
```

### AML Screening
```bash
AML_ENABLED=true
AML_CACHE_ENABLED=true
AML_CACHE_TTL_DAYS=30
AML_FAIL_OPEN=false  # true = approve if AML provider fails
```

## Security Configuration

### Encryption
```bash
ENCRYPTION_ALGORITHM=aes-256-cbc
ENCRYPTION_KEY=your-32-character-encryption-key
JWT_SECRET=your-jwt-secret-key
JWT_EXPIRATION=24h
```

### CORS
```bash
CORS_ENABLED=true
CORS_ORIGINS=http://localhost:3000,http://wallet-app:3000,https://yourdomain.com
CORS_CREDENTIALS=true
```

### Rate Limiting
```bash
RATE_LIMIT_ENABLED=true
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_SKIP_SUCCESSFUL_REQUESTS=false
```

## Issuer Configuration

### Verifiable Credentials
```bash
ISSUER_DID=did:example:issuer123
ISSUER_NAME=KYC-Vault Issuer
ISSUER_LOGO_URL=https://your-domain.com/logo.png
```

### Credential Issuance
```bash
CREDENTIAL_EXPIRATION_DAYS=365
CREDENTIAL_REVOCATION_ENABLED=true
CREDENTIAL_REVOCATION_URL=https://issuer.example.com/revocation
```

## Notification Configuration

### Email (Optional)
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM_EMAIL=noreply@kyc-vault.com
SMTP_FROM_NAME=KYC-Vault
```

### Webhook Notifications
```bash
NOTIFICATION_CHANNEL=webhook  # webhook, email, sms, all
WEBHOOK_RETRY_ENABLED=true
WEBHOOK_RETRY_BACKOFF_EXPONENTIAL=true
```

## Monitoring & Analytics

### Application Insights
```bash
APPLICATION_INSIGHTS_KEY=your_appinsights_key
ENABLE_TELEMETRY=true
TELEMETRY_SAMPLE_RATE=1.0
```

### Prometheus Metrics
```bash
PROMETHEUS_ENABLED=true
PROMETHEUS_PORT=9090
PROMETHEUS_METRICS_PATH=/metrics
```

### Error Tracking
```bash
SENTRY_ENABLED=false
SENTRY_DSN=https://your-sentry-key@sentry.io/project-id
SENTRY_ENVIRONMENT=production
```

## Development Configuration

### Testing
```bash
NODE_ENV=test
TEST_DATABASE_URL=postgresql://test_user:test_pass@localhost:5432/kyc_vault_test
TEST_DISABLE_EXTERNAL_CALLS=true
```

### Debugging
```bash
DEBUG=kyc-vault:*
DEBUG_REQUEST_LOGGING=true
DEBUG_RESPONSE_LOGGING=true
```

## Docker/Compose Configuration

```bash
# For docker-compose.yml
COMPOSE_PROJECT_NAME=kyc-vault
DATABASE_HOST=postgres
REDIS_HOST=redis
ISSUER_SERVICE_HOST=issuer-service
```

## Complete Example .env File

```bash
# AWS
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AWS_REGION=us-east-1
AWS_S3_BUCKET=kyc-vault-documents

# Database
DATABASE_HOST=postgres
DATABASE_PORT=5432
DATABASE_USER=kyc_user
DATABASE_PASSWORD=secure_password_123
DATABASE_NAME=kyc_vault
DATABASE_SYNC=false

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_DB=0

# API
ISSUER_SERVICE_PORT=3001
ISSUER_SERVICE_HOST=0.0.0.0
LOG_LEVEL=info

# KYC
KYC_CONFIDENCE_THRESHOLD=0.95
AML_ENABLED=true
AML_PROVIDER=sanction-scanner
SANCTION_SCANNER_API_KEY=your_key_here

# Security
ENCRYPTION_KEY=your-32-character-encryption-key-here
JWT_SECRET=your-jwt-secret-key-here
CORS_ENABLED=true
CORS_ORIGINS=http://localhost:3000,http://localhost:3001

# Webhook
WEBHOOK_MAX_RETRIES=3
WEBHOOK_TIMEOUT_MS=10000

# Issuer
ISSUER_DID=did:example:issuer123
ISSUER_NAME=KYC-Vault Issuer
CREDENTIAL_EXPIRATION_DAYS=365

# Environment
NODE_ENV=production
```

## Setting Up Environment Variables

### 1. Copy Template
```bash
cp .env.example .env
```

### 2. Update Values
Edit `.env` with your actual values:
```bash
nano .env
```

### 3. Validate Configuration
```bash
npm run validate:env
```

### 4. Load Environment Variables
```bash
# For Docker
source .env
docker-compose up -d

# For Local Development
source .env
npm start
```

## Security Best Practices

1. **Never commit `.env` to git**
   ```bash
   echo ".env" >> .gitignore
   ```

2. **Use AWS Secrets Manager for production**
   ```bash
   aws secretsmanager create-secret \
     --name kyc-vault/prod \
     --secret-string file://./env.json
   ```

3. **Rotate API Keys regularly**
   - Sanction Scanner API key: every 90 days
   - AWS Access Keys: every 6 months
   - JWT Secret: every 6 months

4. **Encrypt sensitive values**
   ```bash
   openssl enc -aes-256-cbc -in .env -out .env.encrypted
   ```

5. **Use IAM Roles instead of Access Keys**
   ```bash
   # For ECS/EC2 deployments
   export AWS_ROLE_ARN=arn:aws:iam::ACCOUNT:role/kyc-vault-role
   ```

## Troubleshooting

### Database Connection Error
```bash
# Check PostgreSQL is running
pg_isready -h localhost -p 5432

# Verify credentials
psql -h localhost -U kyc_user -d kyc_vault
```

### AWS Credentials Error
```bash
# Verify AWS CLI configuration
aws sts get-caller-identity

# Check IAM permissions
aws iam list-user-policies --user-name your-user
```

### Webhook Delivery Failing
```bash
# Check webhook logs
docker logs issuer-service | grep webhook

# Verify webhook URL is accessible
curl -X POST https://your-webhook-url -d '{"test": true}'
```

## Reference

- [AWS SDK Documentation](https://docs.aws.amazon.com/sdk-for-javascript/)
- [Sanction Scanner API](https://sanctionscanner.com/api-documentation)
- [OpenSanctions](https://opensanctions.org/datasets/)
- [NestJS Configuration](https://docs.nestjs.com/techniques/configuration)
