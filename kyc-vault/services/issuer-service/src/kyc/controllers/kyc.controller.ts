import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { KYCService } from '../services/kyc.service';
import { WebhookService } from '../services/webhook.service';
import { CreateKYCDto } from '../dtos/create-kyc.dto';
import { ManualReviewDto } from '../dtos/webhook.dto';
import { DocumentType } from '../services/document-types.service';

@Controller('api/kyc')
export class KYCController {
  private logger = new Logger(KYCController.name);

  constructor(
    private kycService: KYCService,
    private webhookService: WebhookService,
  ) {}

  /**
   * POST /api/kyc/initiate
   * Initiate a new KYC verification
   */
  @Post('initiate')
  async initiateKYC(@Body() dto: CreateKYCDto) {
    try {
      this.logger.debug(`Initiating KYC: ${dto.walletDid}`);
      const kyc = await this.kycService.initiateKYC(dto);
      return {
        success: true,
        kycId: kyc.id,
        status: kyc.status,
        createdAt: kyc.createdAt,
      };
    } catch (error) {
      this.logger.error(`Error in initiateKYC: ${error.message}`);
      throw error;
    }
  }

  /**
   * POST /api/kyc/:kycId/upload-session
   * Create upload session
   */
  @Post(':kycId/upload-session')
  async createUploadSession(@Param('kycId') kycId: string) {
    try {
      this.logger.debug(`Creating upload session for ${kycId}`);
      const session = await this.kycService.createUploadSession(kycId);
      return {
        success: true,
        sessionId: session.id,
        expiry: session.sessionExpiry,
      };
    } catch (error) {
      this.logger.error(`Error in createUploadSession: ${error.message}`);
      throw error;
    }
  }

  /**
   * POST /api/kyc/:kycId/upload-document
   * Upload document with multipart form
   */
  @Post(':kycId/upload-document')
  @UseInterceptors(FileInterceptor('document'))
  async uploadDocument(
    @Param('kycId') kycId: string,
    @Body('documentType') documentType: string,
    @UploadedFile() file: any,
  ) {
    try {
      if (!file) {
        throw new BadRequestException('No file provided');
      }

      if (!documentType || !Object.values(DocumentType).includes(documentType as any)) {
        throw new BadRequestException(`Invalid document type: ${documentType}`);
      }

      this.logger.debug(`Uploading ${documentType} for KYC ${kycId}`);
      const result = await this.kycService.uploadDocument(
        kycId,
        documentType as DocumentType,
        file,
      );

      return {
        success: true,
        documentId: result.documentId,
        s3Key: result.s3Key,
      };
    } catch (error) {
      this.logger.error(`Error in uploadDocument: ${error.message}`);
      throw error;
    }
  }

  /**
   * POST /api/kyc/:kycId/verify
   * Trigger KYC verification pipeline
   */
  @Post(':kycId/verify')
  async verifyKYC(@Param('kycId') kycId: string) {
    try {
      this.logger.debug(`Verifying KYC ${kycId}`);
      const result = await this.kycService.verifyKYC(kycId);
      return {
        success: true,
        ...result,
      };
    } catch (error) {
      this.logger.error(`Error in verifyKYC: ${error.message}`);
      throw error;
    }
  }

  /**
   * GET /api/kyc/:kycId/status
   * Get KYC verification status
   */
  @Get(':kycId/status')
  async getKYCStatus(@Param('kycId') kycId: string) {
    try {
      this.logger.debug(`Getting status for KYC ${kycId}`);
      const kyc = await this.kycService.getKYCStatus(kycId);
      return {
        success: true,
        kycId: kyc.id,
        status: kyc.status,
        confidenceScore: kyc.confidenceScore,
        verificationData: kyc.verificationData,
        documents: kyc.documents,
        verifiedAt: kyc.verifiedAt,
      };
    } catch (error) {
      this.logger.error(`Error in getKYCStatus: ${error.message}`);
      throw error;
    }
  }

  /**
   * GET /api/kyc/manual-review/pending
   * Get pending manual reviews
   */
  @Get('manual-review/pending')
  async getPendingReviews() {
    try {
      this.logger.debug(`Fetching pending reviews`);
      const pending = await this.kycService.getPendingReviews();
      return {
        success: true,
        count: pending.length,
        reviews: pending.map((kyc) => ({
          kycId: kyc.id,
          applicantName: kyc.applicantName,
          applicantEmail: kyc.applicantEmail,
          status: kyc.status,
          confidenceScore: kyc.confidenceScore,
          documents: kyc.documents,
          verificationData: kyc.verificationData,
          createdAt: kyc.createdAt,
        })),
      };
    } catch (error) {
      this.logger.error(`Error in getPendingReviews: ${error.message}`);
      throw error;
    }
  }

  /**
   * POST /api/kyc/:kycId/manual-review
   * Submit manual review decision
   */
  @Post(':kycId/manual-review')
  async submitManualReview(
    @Param('kycId') kycId: string,
    @Body() dto: ManualReviewDto,
  ) {
    try {
      this.logger.debug(`Submitting manual review for ${kycId}`);
      
      if (!['approved', 'rejected', 'info_requested'].includes(dto.decision)) {
        throw new BadRequestException('Invalid decision');
      }

      await this.kycService.submitManualReview(kycId, dto);
      return {
        success: true,
        message: `Manual review submitted: ${dto.decision}`,
      };
    } catch (error) {
      this.logger.error(`Error in submitManualReview: ${error.message}`);
      throw error;
    }
  }

  /**
   * POST /api/kyc/webhook/register
   * Register webhook for wallet notifications
   */
  @Post('webhook/register')
  async registerWebhook(@Body('walletDid') walletDid: string, @Body('webhookUrl') webhookUrl: string) {
    try {
      this.logger.debug(`Registering webhook for ${walletDid}`);
      const webhook = await this.webhookService.registerWebhook({
        walletDid,
        webhookUrl,
      });
      return {
        success: true,
        webhookId: webhook.id,
        secret: webhook.secret,
      };
    } catch (error) {
      this.logger.error(`Error in registerWebhook: ${error.message}`);
      throw error;
    }
  }
}
