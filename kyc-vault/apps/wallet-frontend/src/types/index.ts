export interface DIDs {
  success: boolean;
  data: {
    did: string;
    controllerKeyId: string;
  };
}

export interface StoredCredential {
  id: string;
  jwt: string;
  templateName: string;
  issuerDid: string;
  claims: Record<string, any>;
  issuedAt: number;
  verified: boolean;
  verificationPayload: any;
}

export interface VerificationResult {
  verified: boolean;
  payload?: {
    vc: any;
    sub: string;
    iss: string;
    nbf: number;
  };
  didResolutionResult?: any;
  issuer?: string;
  signer?: any;
  jwt?: string;
}

export interface VerificationRequest {
  id: string;
  verifierId: string;
  requestedCredentialTypes: string[];
  purpose: string;
  expiresAt: number;
  challenge: string;
  audience?: string;
}

export interface PresentationResponse {
  success: boolean;
  data: {
    presentationJwt: string;
    verifiableCredential: any[];
  };
}

export interface WalletSettings {
  theme: "light" | "dark";
  notificationsEnabled: boolean;
  autoVerifyCredentials: boolean;
  hapticEnabled: boolean;
}

export interface CredentialTemplate {
  id: string;
  name: string;
  issuerDid: string;
  claims: string[];
  createdAt: number;
}

export interface IssuanceRequest {
  templateId: string;
  issuerDid: string;
  subjectDid: string;
  claims: Record<string, any>;
}

export interface IssuanceResponse {
  success: boolean;
  data: {
    credentialId: string;
    credential: string;
    status: "issued" | "pending" | "revoked";
    issuedAt: number;
  };
}
