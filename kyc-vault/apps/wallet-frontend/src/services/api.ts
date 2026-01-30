import axios, { AxiosInstance } from "axios";
import {
  DIDs,
  VerificationResult,
  VerificationRequest,
  PresentationResponse,
  IssuanceResponse,
} from "../types";
import { ErrorHandler } from "./errorHandler";

// Service URLs - configurable via environment variables
const VERAMO_AGENT_URL = process.env.EXPO_PUBLIC_VERAMO_URL || "http://localhost:3001";
const ISSUER_SERVICE_URL = process.env.EXPO_PUBLIC_ISSUER_URL || "http://localhost:3002";
const VERIFIER_SERVICE_URL = process.env.EXPO_PUBLIC_VERIFIER_URL || "http://localhost:3003";
const NOTIFICATION_SERVICE_URL = process.env.EXPO_PUBLIC_NOTIFICATION_URL || "http://localhost:3004";
const REVOCATION_SERVICE_URL = process.env.EXPO_PUBLIC_REVOCATION_URL || "http://localhost:3005";
const API_GATEWAY_URL = process.env.EXPO_PUBLIC_API_GATEWAY_URL || "http://localhost:5000";

const API_TIMEOUT = 30000;

class KYCVaultAPI {
  private veramoClient: AxiosInstance;
  private issuerClient: AxiosInstance;
  private verifierClient: AxiosInstance;
  private notificationClient: AxiosInstance;
  private revocationClient: AxiosInstance;
  private apiGatewayClient: AxiosInstance;

  constructor() {
    // Veramo Agent client
    this.veramoClient = axios.create({
      baseURL: VERAMO_AGENT_URL,
      timeout: API_TIMEOUT,
      headers: { "Content-Type": "application/json" },
    });

    // Issuer Service client
    this.issuerClient = axios.create({
      baseURL: ISSUER_SERVICE_URL,
      timeout: API_TIMEOUT,
      headers: { "Content-Type": "application/json" },
    });

    // Verifier Service client
    this.verifierClient = axios.create({
      baseURL: VERIFIER_SERVICE_URL,
      timeout: API_TIMEOUT,
      headers: { "Content-Type": "application/json" },
    });

    // Notification Service client
    this.notificationClient = axios.create({
      baseURL: NOTIFICATION_SERVICE_URL,
      timeout: API_TIMEOUT,
      headers: { "Content-Type": "application/json" },
    });

    // Revocation Service client
    this.revocationClient = axios.create({
      baseURL: REVOCATION_SERVICE_URL,
      timeout: API_TIMEOUT,
      headers: { "Content-Type": "application/json" },
    });

    // API Gateway client (for KYC and aggregated endpoints)
    this.apiGatewayClient = axios.create({
      baseURL: API_GATEWAY_URL,
      timeout: API_TIMEOUT,
      headers: { "Content-Type": "application/json" },
    });
    
    console.log("[API] Initialized:");
    console.log(`  - Veramo Agent: ${VERAMO_AGENT_URL}`);
    console.log(`  - Issuer Service: ${ISSUER_SERVICE_URL}`);
    console.log(`  - Verifier Service: ${VERIFIER_SERVICE_URL}`);
    console.log(`  - Notification Service: ${NOTIFICATION_SERVICE_URL}`);
    console.log(`  - Revocation Service: ${REVOCATION_SERVICE_URL}`);
    console.log(`  - API Gateway: ${API_GATEWAY_URL}`);
  }

  /**
   * Check if API is reachable
   */
  async checkHealth(): Promise<boolean> {
    try {
      console.log("[API] Checking health...");
      const response = await this.apiGatewayClient.get("/health");
      console.log("[API] Health check passed:", response.data);
      return true;
    } catch (error) {
      console.error("[API] Health check failed:", error);
      return false;
    }
  }

  /**
   * Create a new DID for the wallet user
   */
  async createDID(): Promise<DIDs> {
    try {
      console.log("[API] Creating DID...");
      const response = await this.veramoClient.post<DIDs>("/api/did", {
        didMethod: "did:key",
      });
      console.log("[API] DID created successfully:", response.data);
      return response.data;
    } catch (error) {
      console.error("[API] Error creating DID:", error);
      throw this.handleError(error);
    }
  }

  /**
   * Verify a credential JWT
   */
  async verifyCredential(jwtString: string): Promise<VerificationResult> {
    try {
      const response = await this.veramoClient.post<{ data: VerificationResult }>(
        "/api/vc/verify",
        { credential: jwtString }
      );
      return response.data.data;
    } catch (error) {
      console.error("Error verifying credential:", error);
      throw this.handleError(error);
    }
  }

  /**
   * Create a presentation from stored credentials
   */
  async createPresentation(
    holderDid: string,
    credentials: string[],
    audience: string,
    challenge: string
  ): Promise<PresentationResponse> {
    try {
      const response = await this.veramoClient.post<PresentationResponse>(
        "/api/vc/present",
        {
          holderDid,
          credentials,
          audience,
          challenge,
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error creating presentation:", error);
      throw this.handleError(error);
    }
  }

  /**
   * Get verification request details
   */
  async getVerificationRequest(
    requestId: string
  ): Promise<VerificationRequest> {
    try {
      const response = await this.verifierClient.get<{ data: VerificationRequest }>(
        `/api/verifier/request/${requestId}`
      );
      return response.data.data;
    } catch (error) {
      console.error("Error getting verification request:", error);
      throw this.handleError(error);
    }
  }

  /**
   * Submit a presentation to verifier
   */
  async submitPresentation(
    presentationJwt: string,
    requestId: string
  ): Promise<any> {
    try {
      const response = await this.verifierClient.post(
        `/api/verifier/verify/${requestId}`,
        {
          presentation: presentationJwt,
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error submitting presentation:", error);
      throw this.handleError(error);
    }
  }

  /**
   * Create a presentation request
   */
  async createPresentationRequest(
    verifierDid: string,
    requestedCredentials: Array<{ type: string; fields: string[] }>,
    purpose: string
  ): Promise<any> {
    try {
      const response = await this.verifierClient.post(
        "/api/verifier/request",
        {
          verifierDid,
          requestedCredentials,
          purpose,
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error creating presentation request:", error);
      throw this.handleError(error);
    }
  }

  /**
   * Verify a presentation submission
   */
  async verifyPresentation(
    requestId: string,
    presentation: Record<string, unknown>,
    holderDid: string
  ): Promise<any> {
    try {
      const response = await this.verifierClient.post(
        "/api/verifier/verify",
        {
          requestId,
          presentation,
          holderDid,
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error verifying presentation:", error);
      throw this.handleError(error);
    }
  }

  /**
   * Get verification result
   */
  async getVerificationResult(requestId: string): Promise<any> {
    try {
      const response = await this.verifierClient.get(
        `/api/verifier/result/${requestId}`
      );
      return response.data;
    } catch (error) {
      console.error("Error getting verification result:", error);
      throw this.handleError(error);
    }
  }

  /**
   * Issue a credential via issuer service
   */
  async issueCredential(
    templateId: string,
    issuerDid: string,
    subjectDid: string,
    claims: Record<string, any>
  ): Promise<IssuanceResponse> {
    try {
      const response = await this.issuerClient.post<IssuanceResponse>(
        "/api/issuer/issuance/issue",
        {
          templateId,
          issuerDid,
          subjectDid,
          claims,
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error issuing credential:", error);
      throw this.handleError(error);
    }
  }

  /**
   * Get credential templates from issuer
   */
  async getCredentialTemplates(issuerDid: string): Promise<any> {
    try {
      const response = await this.issuerClient.get(
        `/api/issuer/templates/${issuerDid}`
      );
      return response.data;
    } catch (error) {
      console.error("Error getting credential templates:", error);
      throw this.handleError(error);
    }
  }

  /**
   * Get single credential template details
   */
  async getCredentialTemplate(templateId: string): Promise<any> {
    try {
      const response = await this.issuerClient.get(
        `/api/issuer/templates/${templateId}/details`
      );
      return response.data;
    } catch (error) {
      console.error("Error getting credential template details:", error);
      throw this.handleError(error);
    }
  }

  /**
   * Get issuance history for an issuer
   */
  async getIssuanceHistory(issuerDid: string): Promise<any> {
    try {
      const response = await this.issuerClient.get(
        `/api/issuer/issuance/history/${issuerDid}`
      );
      return response.data;
    } catch (error) {
      console.error("Error getting issuance history:", error);
      throw this.handleError(error);
    }
  }

  /**
   * Revoke a credential
   */
  async revokeCredential(
    credentialId: string,
    issuerDid: string,
    reason?: string
  ): Promise<any> {
    try {
      const response = await this.issuerClient.post(
        "/api/issuer/issuance/revoke",
        {
          credentialId,
          issuerDid,
          reason,
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error revoking credential:", error);
      throw this.handleError(error);
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.apiGatewayClient.get("/health");
      return response.status === 200;
    } catch (error) {
      console.error("Health check failed:", error);
      return false;
    }
  }

  /**
   * Initiate KYC verification
   */
  async initiateKYC(data: {
    walletDid: string;
    applicantName: string;
    applicantEmail: string;
    applicantPhone?: string;
  }): Promise<any> {
    try {
      console.log("[API] Initiating KYC...");
      const response = await this.apiGatewayClient.post("/api/kyc/initiate", data);
      console.log("[API] KYC initiated:", response.data);
      return response;
    } catch (error) {
      console.error("[API] Error initiating KYC:", error);
      throw this.handleError(error);
    }
  }

  /**
   * Create upload session for KYC documents
   */
  async createUploadSession(
    kycId: string,
    data: { requiredDocuments: string[] }
  ): Promise<any> {
    try {
      console.log("[API] Creating upload session...");
      const response = await this.apiGatewayClient.post(
        `/api/kyc/${kycId}/upload-session`,
        data
      );
      console.log("[API] Upload session created:", response.data);
      return response;
    } catch (error) {
      console.error("[API] Error creating upload session:", error);
      throw this.handleError(error);
    }
  }

  /**
   * Upload document for KYC
   */
  async uploadDocument(
    kycId: string,
    documentType: string,
    file: any
  ): Promise<any> {
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("documentType", documentType);

      const response = await this.apiGatewayClient.post(
        `/api/kyc/${kycId}/upload-document`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      return response;
    } catch (error) {
      console.error("[API] Error uploading document:", error);
      throw this.handleError(error);
    }
  }

  /**
   * Verify KYC
   */
  async verifyKYC(kycId: string, data?: any): Promise<any> {
    try {
      console.log("[API] Verifying KYC...");
      const response = await this.apiGatewayClient.post(`/api/kyc/${kycId}/verify`, data || {});
      console.log("[API] KYC verified:", response.data);
      return response;
    } catch (error) {
      console.error("[API] Error verifying KYC:", error);
      throw this.handleError(error);
    }
  }

  /**
   * Get KYC status
   */
  async getKYCStatus(kycId: string): Promise<any> {
    try {
      console.log("[API] Getting KYC status...");
      const response = await this.apiGatewayClient.get(`/api/kyc/${kycId}/status`);
      console.log("[API] KYC status:", response.data);
      return response;
    } catch (error) {
      console.error("[API] Error getting KYC status:", error);
      throw this.handleError(error);
    }
  }

  /**
   * Register webhook for KYC notifications
   */
  async registerWebhook(data: {
    walletDid: string;
    webhookUrl: string;
  }): Promise<any> {
    try {
      console.log("[API] Registering webhook...");
      const response = await this.apiGatewayClient.post("/api/kyc/webhook/register", data);
      console.log("[API] Webhook registered:", response.data);
      return response;
    } catch (error) {
      console.error("[API] Error registering webhook:", error);
      throw this.handleError(error);
    }
  }

  /**
   * Error handling
   */
  private handleError(error: any): Error {
    const appError = ErrorHandler.handle(error);
    ErrorHandler.logError(error, "[API] Request failed");
    return new Error(appError.userMessage);
  }
}

export const api = new KYCVaultAPI();
