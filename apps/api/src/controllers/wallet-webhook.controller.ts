import { Controller, Post, Body, Headers, Logger } from '@nestjs/common';
import { WalletService } from '../services/wallet.service';

interface WebhookPayload {
  eventType: string;
  kycId: string;
  timestamp: string;
  walletDid: string;
  data: any;
}

@Controller('api/wallet')
export class WalletController {
  private logger = new Logger(WalletController.name);

  constructor(private walletService: WalletService) {}

  /**
   * Webhook endpoint to receive KYC status updates from issuer
   */
  @Post('webhook')
  async handleWebhook(
    @Body() payload: WebhookPayload,
    @Headers('x-webhook-signature') signature: string,
    @Headers('x-webhook-timestamp') timestamp: string,
  ): Promise<{ status: string }> {
    try {
      this.logger.debug(
        `Received webhook: ${payload.eventType} for KYC ${payload.kycId}`,
      );

      // Verify signature (in production)
      // const isValid = this.verifySignature(payload, signature);
      // if (!isValid) {
      //   throw new Error('Invalid webhook signature');
      // }

      // Route based on event type
      switch (payload.eventType) {
        case 'kyc.verification_started':
          await this.handleVerificationStarted(payload);
          break;

        case 'kyc.verification_completed':
          await this.handleVerificationCompleted(payload);
          break;

        case 'kyc.verification_failed':
          await this.handleVerificationFailed(payload);
          break;

        case 'kyc.review_requested':
          await this.handleReviewRequested(payload);
          break;

        default:
          this.logger.warn(`Unknown event type: ${payload.eventType}`);
      }

      return { status: 'received' };
    } catch (error) {
      this.logger.error(`Error handling webhook: ${error.message}`);
      return { status: 'error' };
    }
  }

  /**
   * Handle KYC verification started event
   */
  private async handleVerificationStarted(payload: WebhookPayload): Promise<void> {
    this.logger.log(`KYC verification started for ${payload.kycId}`);
    // Store in local wallet state/notification
    // TODO: Update wallet store with notification
  }

  /**
   * Handle KYC verification completed event
   */
  private async handleVerificationCompleted(payload: WebhookPayload): Promise<void> {
    const { kycId, data } = payload;
    this.logger.log(`KYC verification completed: ${kycId}, approved: ${data.status}`);

    // If approved, issue credential to wallet
    if (data.status === 'approved') {
      await this.walletService.issueKYCCredential(payload.walletDid, payload.data);
    }

    // Store notification for user
    // TODO: Update wallet store with result
  }

  /**
   * Handle verification failed event
   */
  private async handleVerificationFailed(payload: WebhookPayload): Promise<void> {
    this.logger.error(
      `KYC verification failed for ${payload.kycId}: ${payload.data.reason}`,
    );
    // TODO: Update wallet store with failure reason
  }

  /**
   * Handle manual review requested event
   */
  private async handleReviewRequested(payload: WebhookPayload): Promise<void> {
    const { kycId, data } = payload;
    this.logger.log(`Manual review requested for ${kycId}`);
    this.logger.debug(`Required documents: ${data.requiredDocuments?.join(', ')}`);
    // TODO: Update wallet store to show review request
  }
}
