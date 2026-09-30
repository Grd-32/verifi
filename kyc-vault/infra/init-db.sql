-- Initialize databases for KYC-Vault

-- Create service databases (kyc-vault is created by POSTGRES_DB)
CREATE DATABASE "veramo-db" ENCODING 'UTF8';
CREATE DATABASE "issuer-db" ENCODING 'UTF8';
CREATE DATABASE "verifier-db" ENCODING 'UTF8';
CREATE DATABASE "notification-db" ENCODING 'UTF8';
CREATE DATABASE "revocation-db" ENCODING 'UTF8';
CREATE DATABASE "kyc-db" ENCODING 'UTF8';

-- Grant all privileges on all databases to kyc-admin user
GRANT ALL PRIVILEGES ON DATABASE "kyc-vault" TO "kyc-admin";
GRANT ALL PRIVILEGES ON DATABASE "veramo-db" TO "kyc-admin";
GRANT ALL PRIVILEGES ON DATABASE "issuer-db" TO "kyc-admin";
GRANT ALL PRIVILEGES ON DATABASE "verifier-db" TO "kyc-admin";
GRANT ALL PRIVILEGES ON DATABASE "notification-db" TO "kyc-admin";
GRANT ALL PRIVILEGES ON DATABASE "revocation-db" TO "kyc-admin";
GRANT ALL PRIVILEGES ON DATABASE "kyc-db" TO "kyc-admin";

-- Create schema tables in issuer-db (KYC tables will be here)
\connect issuer-db

CREATE TABLE IF NOT EXISTS schema_migrations (
  version BIGINT PRIMARY KEY,
  dirty BOOLEAN NOT NULL
);

