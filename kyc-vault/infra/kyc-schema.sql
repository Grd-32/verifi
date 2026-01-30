-- KYC Verification Schema
-- Stores document uploads, verification results, and evidence trail

-- KYC Verifications table
CREATE TABLE IF NOT EXISTS kyc_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  applicant_did VARCHAR NOT NULL,
  email VARCHAR NOT NULL,
  status VARCHAR NOT NULL DEFAULT 'pending', -- pending, processing, verified, rejected, expired
  
  -- Submitted documents (encrypted in S3, references stored here)
  id_document_s3_key VARCHAR,
  id_document_filename VARCHAR,
  id_document_uploaded_at TIMESTAMP,
  
  selfie_s3_key VARCHAR,
  selfie_filename VARCHAR,
  selfie_uploaded_at TIMESTAMP,
  
  address_proof_s3_key VARCHAR,
  address_proof_filename VARCHAR,
  address_proof_uploaded_at TIMESTAMP,
  
  -- Extracted data from OCR
  extracted_full_name VARCHAR,
  extracted_date_of_birth DATE,
  extracted_id_type VARCHAR, -- passport, driver_license, national_id, etc.
  extracted_id_number VARCHAR,
  extracted_id_expiry_date DATE,
  extracted_id_issue_country VARCHAR,
  extracted_address VARCHAR,
  
  -- OCR confidence
  ocr_confidence NUMERIC DEFAULT 0,
  ocr_raw_response TEXT, -- Store raw AWS Textract response
  
  -- Facial recognition results
  facial_match_score NUMERIC DEFAULT 0, -- 0-1, compares ID photo to selfie
  liveness_score NUMERIC DEFAULT 0, -- 0-1, checks if face is real person
  facial_recognition_status VARCHAR, -- verified, failed, inconclusive
  facial_raw_response TEXT, -- Store raw AWS Rekognition response
  
  -- Document validation
  id_document_valid BOOLEAN,
  id_document_not_expired BOOLEAN,
  id_document_quality_score NUMERIC,
  document_authenticity_check VARCHAR, -- passed, failed, manual_review
  
  -- AML/Sanctions screening
  aml_screening_status VARCHAR, -- clear, alert, high_risk, manual_review
  aml_screening_timestamp TIMESTAMP,
  aml_matches TEXT, -- JSON array of any matches found
  
  -- Final verification result
  final_verification_status VARCHAR, -- approved, rejected, manual_review
  verification_notes TEXT,
  manual_reviewed_by VARCHAR, -- user who reviewed if needed
  manual_reviewed_at TIMESTAMP,
  
  -- Issued credential reference
  issued_credential_id VARCHAR,
  credential_issued_at TIMESTAMP,
  
  -- Audit trail
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  expires_at TIMESTAMP, -- KYC verification expiry (e.g., 1 year)
  
  -- Compliance
  reviewed_for_compliance_at TIMESTAMP,
  compliance_notes TEXT,
  
  UNIQUE(applicant_did),
  INDEX idx_applicant_did (applicant_did),
  INDEX idx_status (status),
  INDEX idx_email (email),
  INDEX idx_created_at (created_at)
);

-- Document upload sessions (for multipart/chunked uploads)
CREATE TABLE IF NOT EXISTS kyc_upload_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kyc_verification_id UUID NOT NULL REFERENCES kyc_verifications(id) ON DELETE CASCADE,
  document_type VARCHAR NOT NULL, -- id_document, selfie, address_proof
  
  s3_upload_id VARCHAR, -- Multipart upload ID from S3
  upload_started_at TIMESTAMP DEFAULT NOW(),
  upload_completed_at TIMESTAMP,
  
  file_size_bytes BIGINT,
  file_mime_type VARCHAR,
  
  status VARCHAR DEFAULT 'pending', -- pending, uploading, completed, failed
  error_message TEXT,
  
  INDEX idx_kyc_verification_id (kyc_verification_id)
);

-- KYC verification audit log
CREATE TABLE IF NOT EXISTS kyc_audit_log (
  id BIGSERIAL PRIMARY KEY,
  kyc_verification_id UUID NOT NULL REFERENCES kyc_verifications(id) ON DELETE CASCADE,
  
  action VARCHAR NOT NULL, -- uploaded_document, processing_started, ocr_completed, face_check_completed, aml_screening, verification_approved, etc.
  
  actor_type VARCHAR, -- system, user, api_client
  actor_id VARCHAR,
  
  details TEXT, -- JSON details of what happened
  status VARCHAR, -- success, failed, warning
  error_message TEXT,
  
  created_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_kyc_verification_id (kyc_verification_id),
  INDEX idx_action (action),
  INDEX idx_created_at (created_at)
);

-- KYC templates (for reusable verification workflows)
CREATE TABLE IF NOT EXISTS kyc_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL,
  description TEXT,
  
  -- Document requirements
  require_id_document BOOLEAN DEFAULT true,
  require_selfie BOOLEAN DEFAULT true,
  require_address_proof BOOLEAN DEFAULT false,
  
  -- Verification steps
  enable_ocr BOOLEAN DEFAULT true,
  enable_facial_recognition BOOLEAN DEFAULT true,
  enable_liveness_detection BOOLEAN DEFAULT true,
  enable_aml_screening BOOLEAN DEFAULT true,
  
  -- AML configuration
  aml_provider VARCHAR, -- aws_rekognition, ofac, sanction_scanner, etc.
  aml_lists TEXT, -- JSON array of screening lists
  
  -- Approval workflow
  auto_approve_threshold NUMERIC DEFAULT 0.95, -- confidence threshold for auto-approval
  require_manual_review BOOLEAN DEFAULT false,
  
  -- Credential template to issue after verification
  credential_template_id VARCHAR,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(name)
);

-- AML screening results cache
CREATE TABLE IF NOT EXISTS aml_screening_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name VARCHAR NOT NULL,
  date_of_birth DATE,
  country VARCHAR,
  
  screening_result VARCHAR, -- clear, alert, high_risk
  screening_provider VARCHAR, -- ofac, eu_sanctions, pep_screening, etc.
  matches TEXT, -- JSON array of matches if any
  
  screening_timestamp TIMESTAMP DEFAULT NOW(),
  cache_expires_at TIMESTAMP,
  
  INDEX idx_full_name (full_name),
  INDEX idx_screening_result (screening_result)
);
