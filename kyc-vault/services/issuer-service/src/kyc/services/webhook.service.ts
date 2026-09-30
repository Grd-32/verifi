import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import axios, { AxiosError } from 'axios';
import { KYCVerification } from '../entities/kyc-verification.entity';
import { CreateWebhookDto } from '../dtos/create-webhook.dto';

interface WebhookEvent {
  eventType: 'kyc.verification_started' | 'kyc.verification_completed' | 'kyc.verification_failed' | 'kyc.review_requested';
  kycId: string;
  timestamp: Date;
  data: any;
}

interface WebhookRecord {
  id: string;
  walletDid: string;
  webhookUrl: string;
  secret: string;
  isActive: boolean;
  createdAt: Date;
  lastDeliveredAt?: Date;
  failureCount: number;
}

@Injectable()
export class WebhookService {
  private logger = new Logger(WebhookService.name);
  private maxRetries = 3;
  private retryDelays = [1000, 5000, 30000]; // Exponential backoff: 1s, 5s, 30s

  constructor(
    @InjectRepository(KYCVerification)
    private kycRepository: Repository<KYCVerification>,
  ) {}

  /**
   * Register a webhook for a wallet DID
   */
  async registerWebhook(dto: CreateWebhookDto): Promise<WebhookRecord> {
    try {
      this.logger.debug(`Registering webhook for wallet: ${dto.walletDid}`);

      // In production, store this in database
      const webhook: WebhookRecord = {
        id: this.generateId(),
        walletDid: dto.walletDid,
        webhookUrl: dto.webhookUrl,
        secret: this.generateSecret(),
        isActive: true,
        createdAt: new Date(),
        failureCount: 0,
      };

      // TODO: Save to webhook_endpoints table
      this.logger.log(`Webhook registered: ${webhook.id}`);
      return webhook;
    } catch (error) {
      this.logger.error(`Error registering webhook: ${error.message}`);
      throw error;
    }
  }

  /**
   * Emit event to wallet via webhook
   */
  async emitWebhookEvent(event: WebhookEvent): Promise<void> {
    try {
      this.logger.debug(
        `Emitting webhook event: ${event.eventType} for KYC ${event.kycId}`,
      );

      // Get webhook for this KYC's wallet
      const kyc = await this.kycRepository.findOne({
        where: { id: event.kycId },
      });

      if (!kyc || !kyc.walletDid) {
        this.logger.warn(`No wallet DID found for KYC ${event.kycId}`);
        return;
      }

      // TODO: Get webhook from database by walletDid
      // For now, use mock
      const webhook = this.getMockWebhook(kyc.walletDid);

      if (!webhook || !webhook.isActive) {
        this.logger.warn(`No active webhook for wallet ${kyc.walletDid}`);
        return;
      }

      await this.deliverWebhook(webhook, event);
    } catch (error) {
      this.logger.error(`Error emitting webhook event: ${error.message}`);
    }
  }

  /**
   * Deliver webhook with retry logic
   */
  private async deliverWebhook(
    webhook: WebhookRecord,
    event: WebhookEvent,
    retryCount: number = 0,
  ): Promise<void> {
    try {
      this.logger.debug(
        `Delivering webhook to ${webhook.webhookUrl} (attempt ${retryCount + 1}/${this.maxRetries + 1})`,
      );

      const payload = this.createPayload(webhook, event);
      const signature = this.createSignature(payload, webhook.secret);

      const response = await axios.post(webhook.webhookUrl, payload, {
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': signature,
          'X-Webhook-Timestamp': new Date().toISOString(),
        },
        timeout: 10000,
      });

      if (response.status === 200 || response.status === 202) {
        this.logger.log(`Webhook delivered successfully to ${webhook.webhookUrl}`);
        // TODO: Update webhook lastDeliveredAt, reset failureCount in database
      } else {
        throw new Error(`Unexpected status code: ${response.status}`);
      }
    } catch (error: any) {
      this.logger.warn(
        `Webhook delivery failed (attempt ${retryCount + 1}): ${error.message}`,
      );

      if (retryCount < this.maxRetries) {
        const delay = this.retryDelays[retryCount];
        this.logger.debug(`Retrying in ${delay}ms...`);

        setTimeout(() => {
          this.deliverWebhook(webhook, event, retryCount + 1);
        }, delay);
      } else {
        this.logger.error(`Webhook delivery failed after ${this.maxRetries} retries`);
        // TODO: Update webhook failureCount, potentially mark as inactive
        // TODO: Send alert to issuer that webhook is failing
      }
    }
  }

  /**
   * Create webhook payload
   */
  private createPayload(webhook: WebhookRecord, event: WebhookEvent): any {
    return {
      eventType: event.eventType,
      kycId: event.kycId,
      timestamp: event.timestamp.toISOString(),
      walletDid: webhook.walletDid,
      data: event.data,
    };
  }

  /**
   * Create HMAC signature for webhook verification
   */
  private createSignature(payload: any, secret: string): string {
    const crypto = require('crypto');
    const message = JSON.stringify(payload);
    return crypto
      .createHmac('sha256', secret)
      .update(message)
      .digest('hex');
  }

  /**
   * Notify wallet of KYC verification started
   */
  async notifyVerificationStarted(kycId: string): Promise<void> {
    await this.emitWebhookEvent({
      eventType: 'kyc.verification_started',
      kycId,
      timestamp: new Date(),
      data: {
        message: 'Your KYC verification has started',
        status: 'processing',
      },
    });
  }

  /**
   * Notify wallet of KYC verification completed
   */
  async notifyVerificationCompleted(kycId: string, isApproved: boolean, metadata?: any): Promise<void> {
    await this.emitWebhookEvent({
      eventType: 'kyc.verification_completed',
      kycId,
      timestamp: new Date(),
      data: {
        message: isApproved ? 'Your KYC has been approved' : 'Your KYC verification is complete',
        status: isApproved ? 'approved' : 'pending_review',
        metadata,
      },
    });
  }

  /**
   * Notify wallet of verification failure
   */
  async notifyVerificationFailed(kycId: string, reason: string): Promise<void> {
    await this.emitWebhookEvent({
      eventType: 'kyc.verification_failed',
      kycId,
      timestamp: new Date(),
      data: {
        message: `Your KYC verification failed: ${reason}`,
        status: 'failed',
        reason,
      },
    });
  }

  /**
   * Notify wallet of manual review request
   */
  async notifyManualReviewRequired(kycId: string, requiredDocuments?: string[]): Promise<void> {
    await this.emitWebhookEvent({
      eventType: 'kyc.review_requested',
      kycId,
      timestamp: new Date(),
      data: {
        message: 'Additional documents needed for your KYC',
        status: 'review_requested',
        requiredDocuments: requiredDocuments || ['additional_documents'],
      },
    });
  }

  /**
   * Get active webhooks for wallet
   */
  async getWebhooksForWallet(walletDid: string): Promise<WebhookRecord[]> {
    try {
      // TODO: Query database
      this.logger.debug(`Getting webhooks for wallet: ${walletDid}`);
      return [];
    } catch (error) {
      this.logger.error(`Error getting webhooks: ${error.message}`);
      return [];
    }
  }

  /**
   * Deactivate webhook
   */
  async deactivateWebhook(webhookId: string): Promise<void> {
    try {
      this.logger.debug(`Deactivating webhook: ${webhookId}`);
      // TODO: Update database
    } catch (error) {
      this.logger.error(`Error deactivating webhook: ${error.message}`);
    }
  }

  /**
   * Generate random ID
   */
  private generateId(): string {
    return `hook_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate random secret for signing
   */
  private generateSecret(): string {
    const crypto = require('crypto');
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Mock webhook for development
   */
  private getMockWebhook(walletDid: string): WebhookRecord {
    return {
      id: 'hook_mock_001',
      walletDid,
      webhookUrl: `http://localhost:3000/api/wallet/webhook`, // Mock endpoint
      secret: 'mock_secret',
      isActive: true,
      createdAt: new Date(),
      failureCount: 0,
    };
  }
}
