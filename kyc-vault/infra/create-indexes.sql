-- Create indexes for performance
CREATE INDEX idx_revocation_registry_credential_id ON revocation_registry(credential_id);
CREATE INDEX idx_revocation_registry_issuer_did ON revocation_registry(issuer_did);
CREATE INDEX idx_revocation_registry_revoked ON revocation_registry(revoked);

CREATE INDEX idx_verification_request_verifier_did ON verification_requests(verifier_did);
CREATE INDEX idx_verification_request_status ON verification_requests(status);

CREATE INDEX idx_issuance_log_template_id ON issuance_logs(template_id);
CREATE INDEX idx_issuance_log_subject_did ON issuance_logs(subject_did);

CREATE INDEX idx_notification_message_recipient_did ON notification_messages(recipient_did);
CREATE INDEX idx_notification_message_status ON notification_messages(status);

-- Create views for common queries
CREATE VIEW pending_presentations AS
SELECT * FROM verification_requests WHERE status = 'pending';

CREATE VIEW revoked_credentials AS
SELECT * FROM revocation_registry WHERE revoked = TRUE;
