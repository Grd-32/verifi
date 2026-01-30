import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { RevocationRegistry } from "../entities/revocation-registry.entity";
import { LedgerAnchor } from "../entities/ledger-anchor.entity";
import { LedgerService } from "./ledger.service";
import { v4 as uuidv4 } from "uuid";

@Injectable()
export class RevocationService {
  constructor(
    @InjectRepository(RevocationRegistry)
    private readonly registryRepository: Repository<RevocationRegistry>,
    @InjectRepository(LedgerAnchor)
    private readonly anchorRepository: Repository<LedgerAnchor>,
    private readonly ledgerService: LedgerService
  ) {}

  async revokeCredential(payload: {
    credentialId: string;
    issuerDid: string;
    reason?: string;
    anchorToLedger?: boolean;
    ledger?: "cheqd" | "ion" | "ethr" | "mock";
  }): Promise<RevocationRegistry> {
    const registryId = uuidv4();

    const entry = this.registryRepository.create({
      credentialId: payload.credentialId,
      issuerDid: payload.issuerDid,
      revoked: true,
      revokedAt: new Date(),
      reason: payload.reason,
      registryId,
    });

    const saved = await this.registryRepository.save(entry);

    // Optionally anchor to ledger
    if (payload.anchorToLedger && payload.ledger) {
      const ledgerResult = await this.ledgerService.anchorToLedger(
        payload.ledger,
        registryId,
        { credentialId: payload.credentialId }
      );

      const anchor = this.anchorRepository.create({
        ledger: payload.ledger,
        registryId,
        txId: ledgerResult.txId,
        status: "confirmed",
        url: ledgerResult.url,
      });

      await this.anchorRepository.save(anchor);
    }

    return saved;
  }

  async isRevoked(credentialId: string): Promise<boolean> {
    const entry = await this.registryRepository.findOne({
      where: { credentialId, revoked: true },
    });
    return !!entry;
  }

  async getRevocationStatus(credentialId: string): Promise<{
    revoked: boolean;
    revokedAt?: Date;
    reason?: string;
    anchors?: LedgerAnchor[];
  }> {
    const entry = await this.registryRepository.findOne({
      where: { credentialId },
    });

    if (!entry) {
      return { revoked: false };
    }

    const anchors = await this.anchorRepository.find({
      where: { registryId: entry.registryId },
    });

    return {
      revoked: entry.revoked || false,
      revokedAt: entry.revokedAt || undefined,
      reason: entry.reason || undefined,
      anchors,
    };
  }

  async checkMultipleCredentials(
    credentialIds: string[]
  ): Promise<Record<string, boolean>> {
    const result: Record<string, boolean> = {};

    for (const id of credentialIds) {
      result[id] = await this.isRevoked(id);
    }

    return result;
  }
}
