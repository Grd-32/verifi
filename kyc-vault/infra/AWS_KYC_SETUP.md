# AWS KYC Setup Guide

This guide walks through setting up AWS services for KYC document processing.

## Overview

The KYC system uses the following AWS services:

1. **S3** - Secure document storage
2. **Textract** - OCR (Optical Character Recognition) for ID documents
3. **Rekognition** - Facial recognition and liveness detection
4. **IAM** - Identity and Access Management (permissions)
5. **KMS** - Key Management Service (encryption)

## Prerequisites

- AWS Account with billing enabled
- AWS CLI configured locally
- IAM user with programmatic access (Access Key + Secret Key)

## Step 1: Create S3 Bucket for KYC Documents

```bash
# Create the S3 bucket
aws s3 mb s3://kyc-vault-documents --region us-east-1

# Enable versioning (for audit trail)
aws s3api put-bucket-versioning \
  --bucket kyc-vault-documents \
  --versioning-configuration Status=Enabled

# Enable server-side encryption by default
aws s3api put-bucket-encryption \
  --bucket kyc-vault-documents \
  --server-side-encryption-configuration '{
    "Rules": [
      {
        "ApplyServerSideEncryptionByDefault": {
          "SSEAlgorithm": "AES256"
        }
      }
    ]
  }'

# Block public access (important for privacy)
aws s3api put-public-access-block \
  --bucket kyc-vault-documents \
  --public-access-block-configuration \
  "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"

# Set lifecycle policy to delete old documents after 1 year
aws s3api put-bucket-lifecycle-configuration \
  --bucket kyc-vault-documents \
  --lifecycle-configuration '{
    "Rules": [
      {
        "Id": "delete-old-kyc-docs",
        "Status": "Enabled",
        "Prefix": "kyc-documents/",
        "Expiration": {
          "Days": 365
        }
      }
    ]
  }'
```

## Step 2: Create IAM Role for KYC Service

```bash
# Create trust policy document
cat > kyc-trust-policy.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "ec2.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF

# Create the IAM role
aws iam create-role \
  --role-name kyc-vault-service-role \
  --assume-role-policy-document file://kyc-trust-policy.json

# Create inline policy for S3, Textract, Rekognition
cat > kyc-service-policy.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "S3DocumentAccess",
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::kyc-vault-documents",
        "arn:aws:s3:::kyc-vault-documents/*"
      ]
    },
    {
      "Sid": "TextractAccess",
      "Effect": "Allow",
      "Action": [
        "textract:AnalyzeDocument",
        "textract:GetDocumentAnalysis",
        "textract:StartDocumentAnalysis"
      ],
      "Resource": "*"
    },
    {
      "Sid": "RekognitionAccess",
      "Effect": "Allow",
      "Action": [
        "rekognition:CompareFaces",
        "rekognition:DetectFaces",
        "rekognition:DetectModerationLabels"
      ],
      "Resource": "*"
    },
    {
      "Sid": "KMSAccess",
      "Effect": "Allow",
      "Action": [
        "kms:Decrypt",
        "kms:Encrypt",
        "kms:GenerateDataKey",
        "kms:DescribeKey"
      ],
      "Resource": "arn:aws:kms:us-east-1:ACCOUNT_ID:key/*"
    },
    {
      "Sid": "CloudWatchLogs",
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:us-east-1:ACCOUNT_ID:log-group:/aws/ecs/kyc-service:*"
    }
  ]
}
EOF

# Apply the policy
aws iam put-role-policy \
  --role-name kyc-vault-service-role \
  --policy-name kyc-vault-service-policy \
  --policy-document file://kyc-service-policy.json
```

## Step 3: Create IAM User with Access Keys

```bash
# Create IAM user for the KYC service
aws iam create-user --user-name kyc-vault-service-user

# Create access keys
aws iam create-access-key --user-name kyc-vault-service-user

# Output will include:
# - AccessKeyId (save this)
# - SecretAccessKey (save this - you won't see it again!)

# Attach policy to user
aws iam put-user-policy \
  --user-name kyc-vault-service-user \
  --policy-name kyc-vault-service-policy \
  --policy-document file://kyc-service-policy.json
```

## Step 4: Enable AWS Services

```bash
# Check if Textract is available in your region
aws textract list-document-analysis-jobs --region us-east-1

# Check if Rekognition is available
aws rekognition describe-collection --collection-id test --region us-east-1 || echo "Rekognition available"
```

## Step 5: Configure Environment Variables

Update your `.env` file in the issuer-service:

```bash
# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key_id
AWS_SECRET_ACCESS_KEY=your_secret_access_key
S3_KYC_BUCKET=kyc-vault-documents

# KYC Configuration
KYC_AUTO_APPROVE_THRESHOLD=0.95
KYC_REQUIRE_MANUAL_REVIEW=false
```

## Step 6: Docker Deployment Configuration

Update your docker-compose.yml to pass AWS credentials:

```yaml
issuer-service:
  build: ./services/issuer-service
  environment:
    AWS_REGION: us-east-1
    AWS_ACCESS_KEY_ID: ${AWS_ACCESS_KEY_ID}
    AWS_SECRET_ACCESS_KEY: ${AWS_SECRET_ACCESS_KEY}
    S3_KYC_BUCKET: kyc-vault-documents
    DATABASE_URL: postgres://kyc-admin:kyc-password@postgres:5432/issuer-db
```

## Step 7: Test AWS Configuration

```bash
# Test S3 access
aws s3 ls s3://kyc-vault-documents

# Test Textract (with a sample image)
aws textract detect-document-text \
  --document S3Object={Bucket=kyc-vault-documents,Name=test-image.jpg} \
  --region us-east-1

# Test Rekognition
aws rekognition detect-faces \
  --image S3Object={Bucket=kyc-vault-documents,Name=test-selfie.jpg} \
  --region us-east-1
```

## Costs & Limits

### AWS Service Pricing (as of 2024):

| Service | Pricing | Limit |
|---------|---------|-------|
| **S3 Storage** | $0.023/GB/month | Unlimited |
| **S3 Transfer** | $0.02/GB outbound | Unlimited |
| **Textract** | $0.01-0.04 per page | 1000 pages/min |
| **Rekognition** | $0.001-0.004 per image | 2000 images/sec |

### Monthly Cost Estimate:

- 10,000 KYC verifications/month
- Per KYC: 3 documents (ID + Selfie + optional proof)
- Expected cost: ~$300-500/month

### Service Limits:

- Textract: Max 10MB per document
- Rekognition: Max 5MB per image
- S3: No limit on bucket size or object count

## Security Best Practices

### 1. Enable S3 MFA Delete
```bash
aws s3api put-bucket-versioning \
  --bucket kyc-vault-documents \
  --mfa "arn:aws:iam::ACCOUNT_ID:mfa/root-account-mfa-device 123456" \
  --versioning-configuration Status=Enabled,MFADelete=Enabled
```

### 2. Enable CloudTrail for Audit Logging
```bash
aws cloudtrail create-trail \
  --name kyc-vault-audit \
  --s3-bucket-name kyc-vault-audit-logs \
  --is-multi-region-trail

aws cloudtrail start-logging \
  --trail-name kyc-vault-audit
```

### 3. Set up CloudWatch Alarms
```bash
# Monitor for large downloads (potential data exfiltration)
aws cloudwatch put-metric-alarm \
  --alarm-name kyc-large-s3-download \
  --alarm-actions arn:aws:sns:us-east-1:ACCOUNT_ID:security-alerts \
  --metric-name S3GetObject \
  --statistic Sum \
  --period 300 \
  --threshold 100
```

### 4. Encrypt Documents with KMS
```bash
# Create KMS key for document encryption
aws kms create-key \
  --description "KYC Document Encryption Key" \
  --region us-east-1

# Update S3 bucket to use KMS encryption
aws s3api put-bucket-encryption \
  --bucket kyc-vault-documents \
  --server-side-encryption-configuration '{
    "Rules": [
      {
        "ApplyServerSideEncryptionByDefault": {
          "SSEAlgorithm": "aws:kms",
          "KMSMasterKeyID": "arn:aws:kms:us-east-1:ACCOUNT_ID:key/KEY_ID"
        }
      }
    ]
  }'
```

## Troubleshooting

### Issue: AccessDenied on S3 operations
```
Check IAM policy has correct bucket ARN
aws iam get-user-policy --user-name kyc-vault-service-user --policy-name kyc-vault-service-policy
```

### Issue: Textract operation timeout
```
Textract takes 5-30 seconds per page depending on complexity
Consider implementing async processing with SNS notifications
```

### Issue: Rekognition face not detected
```
- Ensure image has clear face (face must be 40+ pixels in height)
- Check lighting and image quality
- For liveness, ensure open eyes and neutral expression
```

### Issue: S3 bucket not found
```
Double-check bucket name (must be globally unique)
Verify region matches AWS_REGION configuration
aws s3 ls --region us-east-1 | grep kyc-vault
```

## Next Steps

1. Deploy issuer-service with KYC endpoints
2. Create KYC document upload UI
3. Set up credential issuance after KYC approval
4. Configure notification service for user updates
5. Implement KYC result callbacks to wallet

## Reference

- [AWS Textract Documentation](https://docs.aws.amazon.com/textract/)
- [AWS Rekognition Documentation](https://docs.aws.amazon.com/rekognition/)
- [AWS S3 Security Best Practices](https://docs.aws.amazon.com/AmazonS3/latest/userguide/security.html)
- [AWS SDK for JavaScript v3](https://github.com/aws/aws-sdk-js-v3)
