/**
 * W3C Verifiable Credential Types
 */
export interface VerifiableCredential {
  "@context": string[];
  id: string;
  type: string[];
  issuer: string | { id: string };
  issuanceDate: string;
  expirationDate?: string;
  credentialSubject: Record<string, unknown>;
  credentialSchema?: {
    id: string;
    type: string;
  };
  proof: Proof;
}

export interface VerifiablePresentation {
  "@context": string[];
  id: string;
  type: string[];
  verifiableCredential: (VerifiableCredential | string)[];
  holder: string;
  proof: Proof;
}

export interface Proof {
  type: string;
  created?: string;
  proofPurpose?: string;
  verificationMethod?: string;
  jws?: string;
  jwt?: string;
  signatureValue?: string;
}

/**
 * DID Types
 */
export interface DIDDocument {
  "@context": string | string[];
  id: string;
  publicKey?: PublicKey[];
  authentication?: string[];
  assertionMethod?: string[];
  keyAgreement?: string[];
  service?: Service[];
}

export interface PublicKey {
  id: string;
  type: string;
  controller: string;
  publicKeyPem?: string;
  publicKeyJwk?: Record<string, unknown>;
}

export interface Service {
  id: string;
  type: string;
  serviceEndpoint: string | Record<string, unknown>;
}

/**
 * Presentation Request (Verifier → Wallet)
 */
export interface PresentationRequest {
  id: string;
  type: "PresentationRequest";
  requestedCredentials: RequestedCredential[];
  purpose: string;
  minimumTimestamp?: string;
  nonce: string;
  challenge?: string;
}

export interface RequestedCredential {
  type: string;
  fields: string[];
  required?: boolean;
}

/**
 * Issuance Request
 */
export interface IssuanceRequest {
  id: string;
  templateId: string;
  subjectDid: string;
  claims: Record<string, unknown>;
  expirationDate?: string;
}

/**
 * Revocation Entry
 */
export interface RevocationEntry {
  id: string;
  credentialId: string;
  issuerDid: string;
  revokedAt: string;
  reason?: string;
  ledgerAnchoring?: LedgerAnchoring;
}

export interface LedgerAnchoring {
  ledger: "cheqd" | "ion" | "ethr" | "mock";
  txId: string;
  timestamp: string;
  url?: string;
}

/**
 * DIDComm Message (v2)
 */
export interface DIDCommMessage {
  type: string;
  from: string;
  to: string[];
  thid?: string;
  body: Record<string, unknown>;
  attachments?: DIDCommAttachment[];
  createdTime?: number;
  expiresTime?: number;
}

export interface DIDCommAttachment {
  id: string;
  mediaType: string;
  data: {
    base64?: string;
    json?: unknown;
    links?: string[];
  };
}

/**
 * Push Notification (AML Refresh Request)
 */
export interface AMLRefreshRequest {
  id: string;
  type: "AMLRefreshRequest";
  holderDid: string;
  credentialIds: string[];
  reason: "routine_update" | "regulatory_change" | "risk_assessment";
  deadline?: string;
  didcommEncrypted?: boolean;
}

/**
 * API Response Types
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  timestamp: string;
  traceId?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

/**
 * Audit Log
 */
export interface AuditLog {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  resource: {
    type: string;
    id: string;
  };
  changes: Record<string, { before: unknown; after: unknown }>;
  metadata: Record<string, unknown>;
}

/**
 * Credential Metadata
 */
export interface CredentialMetadata {
  id: string;
  type: string;
  issuerDid: string;
  holderDid: string;
  issuanceDate: string;
  expirationDate?: string;
  revoked: boolean;
  revokedAt?: string;
  storageLocation: "local" | "cloud" | "ledger";
  lastVerified?: string;
}
