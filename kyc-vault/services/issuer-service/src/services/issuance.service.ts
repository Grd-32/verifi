import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { IssuanceLog } from "../entities/issuance-log.entity";
import { RevocationLog } from "../entities/revocation-log.entity";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";

@Injectable()
export class IssuanceService {
  constructor(
    @InjectRepository(IssuanceLog)
    private readonly issuanceLogRepository: Repository<IssuanceLog>,
    @InjectRepository(RevocationLog)
    private readonly revocationLogRepository: Repository<RevocationLog>
  ) {}

  async issueCredential(payload: {
    templateId: string;
    subjectDid: string;
    claims: Record<string, unknown>;
    issuerDid: string;
  }): Promise<IssuanceLog> {
    try {
      // Call veramo-agent to issue VC
      const veramoResponse = await axios.post(
        `${process.env.VERAMO_AGENT_URL}/api/vc/issue`,
        {
          issuerDid: payload.issuerDid,
          subjectDid: payload.subjectDid,
          schemaId: payload.templateId,
          claims: payload.claims,
        }
      );

      const credentialId = uuidv4();

      const log = this.issuanceLogRepository.create({
        templateId: payload.templateId,
        subjectDid: payload.subjectDid,
        credentialId,
        claims: payload.claims,
        status: "issued",
      });

      return await this.issuanceLogRepository.save(log);
    } catch (error) {
      console.error("Failed to issue credential:", error);
      throw error;
    }
  }

  async revokeCredential(
    credentialId: string,
    issuerDid: string,
    reason?: string
  ): Promise<RevocationLog> {
    const log = this.revocationLogRepository.create({
      credentialId,
      issuerDid,
      reason,
      ledgerAnchoring: {
        ledger: "mock",
        txId: uuidv4(),
        timestamp: new Date().toISOString(),
      },
    });

    return await this.revocationLogRepository.save(log);
  }

  async getIssuanceHistory(issuerDid: string): Promise<IssuanceLog[]> {
    return await this.issuanceLogRepository.find({
      where: { credentialId: issuerDid },
    });
  }

  async checkRevocation(credentialId: string): Promise<boolean> {
    const revocation = await this.revocationLogRepository.findOne({
      where: { credentialId },
    });
    return !!revocation;
  }
}
