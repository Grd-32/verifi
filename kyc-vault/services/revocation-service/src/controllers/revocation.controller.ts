import { Controller, Post, Get, Body, Param } from "@nestjs/common";
import { RevocationService } from "../services/revocation.service";
import { ApiResponse } from "@kyc-vault/common-types";

@Controller("api/revocation")
export class RevocationController {
  constructor(private readonly revocationService: RevocationService) {}

  @Post("revoke")
  async revoke(
    @Body()
    payload: {
      credentialId: string;
      issuerDid: string;
      reason?: string;
      anchorToLedger?: boolean;
      ledger?: "cheqd" | "ion" | "ethr" | "mock";
    }
  ) {
    const result = await this.revocationService.revokeCredential(payload);
    return {
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    } as ApiResponse;
  }

  @Get(":credentialId")
  async getStatus(@Param("credentialId") credentialId: string) {
    const status = await this.revocationService.getRevocationStatus(credentialId);
    return {
      success: true,
      data: status,
      timestamp: new Date().toISOString(),
    } as ApiResponse;
  }

  @Post("batch-check")
  async batchCheck(@Body() payload: { credentialIds: string[] }) {
    const results = await this.revocationService.checkMultipleCredentials(
      payload.credentialIds
    );
    return {
      success: true,
      data: results,
      timestamp: new Date().toISOString(),
    } as ApiResponse;
  }
}
