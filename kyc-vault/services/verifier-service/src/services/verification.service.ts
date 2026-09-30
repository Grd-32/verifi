import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { VerificationRequest } from "../entities/verification-request.entity";
import { VerificationResult } from "../entities/verification-result.entity";
import { ComplianceService } from "./compliance.service";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";

@Injectable()
export class VerificationService {
  constructor(
    @InjectRepository(VerificationRequest)
    private readonly requestRepository: Repository<VerificationRequest>,
    @InjectRepository(VerificationResult)
    private readonly resultRepository: Repository<VerificationResult>,
    private readonly complianceService: ComplianceService
  ) {}

  async createPresentationRequest(payload: {
    verifierDid: string;
    requestedCredentials: Array<{ type: string; fields: string[] }>;
    purpose: string;
  }): Promise<VerificationRequest> {
    const request = this.requestRepository.create({
      verifierDid: payload.verifierDid,
      requestedCredentials: payload.requestedCredentials,
      purpose: payload.purpose,
      nonce: uuidv4(),
      expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 min expiry
    });

    return await this.requestRepository.save(request);
  }

  async verifyPresentation(payload: {
    requestId: string;
    presentation: Record<string, unknown>;
    holderDid: string;
  }): Promise<VerificationResult> {
    try {
      // Verify with veramo agent
      const veramoResponse = await axios.post(
        `${process.env.VERAMO_AGENT_URL}/api/vc/verify`,
        {
          presentation: payload.presentation,
        }
      );

      if (!veramoResponse.data.data.valid) {
        throw new Error("Presentation verification failed");
      }

      // Extract claims from presentation
      const claims = this._extractClaims(payload.presentation);

      // Run compliance checks
      const amlCheck = await this.complianceService.checkAML(
        (claims.givenName as string) + " " + (claims.familyName as string),
        claims.country as string
      );
      const isSanctioned =
        await this.complianceService.checkSanctionsList(claims.country as string);

      // Create verification result
      const result = this.resultRepository.create({
        requestId: payload.requestId,
        holderDid: payload.holderDid,
        valid: true,
        presentationData: claims,
        complianceChecks: {
          amlCheck,
          sanctionsList: { isSanctioned },
        },
        amlRiskScore: amlCheck.riskScore,
        amlStatus: isSanctioned ? "BLOCK" : amlCheck.status,
      });

      return await this.resultRepository.save(result);
    } catch (error) {
      console.error("Presentation verification failed:", error);
      throw error;
    }
  }

  async getVerificationResult(
    requestId: string
  ): Promise<VerificationResult | null> {
    return await this.resultRepository.findOne({ where: { requestId } });
  }

  private _extractClaims(presentation: Record<string, unknown>): Record<string, unknown> {
    // Extract credential subject from presentation
    const creds = (presentation.verifiableCredential as any[]) || [];
    if (creds.length > 0) {
      return creds[0].credentialSubject || {};
    }
    return {};
  }
}
