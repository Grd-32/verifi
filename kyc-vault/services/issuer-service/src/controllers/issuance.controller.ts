import { Controller, Post, Get, Body, Param } from "@nestjs/common";
import { IssuanceService } from "../services/issuance.service";
import { ApiResponse } from "@kyc-vault/common-types";

@Controller("api/issuer/issuance")
export class IssuanceController {
  constructor(private readonly issuanceService: IssuanceService) {}

  @Post("issue")
  async issue(
    @Body()
    payload: {
      templateId: string;
      subjectDid: string;
      claims: Record<string, unknown>;
      issuerDid: string;
    }
  ) {
    const result = await this.issuanceService.issueCredential(payload);
    return {
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    } as ApiResponse;
  }

  @Post("revoke")
  async revoke(
    @Body()
    payload: {
      credentialId: string;
      issuerDid: string;
      reason?: string;
    }
  ) {
    const result = await this.issuanceService.revokeCredential(
      payload.credentialId,
      payload.issuerDid,
      payload.reason
    );
    return {
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    } as ApiResponse;
  }

  @Get("history/:issuerDid")
  async getHistory(@Param("issuerDid") issuerDid: string) {
    const history = await this.issuanceService.getIssuanceHistory(issuerDid);
    return {
      success: true,
      data: history,
      timestamp: new Date().toISOString(),
    } as ApiResponse;
  }
}
