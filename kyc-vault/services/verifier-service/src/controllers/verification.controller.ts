import { Controller, Post, Get, Body, Param } from "@nestjs/common";
import { VerificationService } from "../services/verification.service";
import { ApiResponse } from "@kyc-vault/common-types";

@Controller("api/verifier")
export class VerificationController {
  constructor(private readonly verificationService: VerificationService) {}

  @Post("request")
  async createRequest(
    @Body()
    payload: {
      verifierDid: string;
      requestedCredentials: Array<{ type: string; fields: string[] }>;
      purpose: string;
    }
  ) {
    const request = await this.verificationService.createPresentationRequest(
      payload
    );
    return {
      success: true,
      data: request,
      timestamp: new Date().toISOString(),
    } as ApiResponse;
  }

  @Post("verify")
  async verifyPresentation(
    @Body()
    payload: {
      requestId: string;
      presentation: Record<string, unknown>;
      holderDid: string;
    }
  ) {
    const result = await this.verificationService.verifyPresentation(payload);
    return {
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    } as ApiResponse;
  }

  @Get("result/:requestId")
  async getResult(@Param("requestId") requestId: string) {
    const result = await this.verificationService.getVerificationResult(
      requestId
    );
    return {
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    } as ApiResponse;
  }
}
