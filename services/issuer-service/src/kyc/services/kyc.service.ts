import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { KYCVerification } from '../entities/kyc-verification.entity';
import { KYCUploadSession } from '../entities/kyc-upload-session.entity';
import { KYCAuditLog } from '../entities/kyc-audit-log.entity';
import { AMLScreeningResult } from '../entities/aml-screening-result.entity';
import { AWSService } from './aws.service';
import { AMLProviderService } from './aml-provider.service';
import { WebhookService } from './webhook.service';
import { DocumentProcessorService, DocumentType } from './document-types.service';
import { CreateKYCDto } from '../dtos/create-kyc.dto';
import { ManualReviewDto } from '../dtos/webhook.dto';

interface KYCResult {
  kycId: string;
  status: 'approved' | 'pending_review' | 'rejected' | 'failed';
  confidence: number;
  checks: {
    ocr_confidence: number;
    facial_match: number;
    liveness_score: number;
    aml_status: string;
  };
  reviewerNotes?: string;
  issuedCredentialId?: string;
}

@Injectable()
export class KYCService {
  private logger = new Logger(KYCService.name);

  constructor(
    @InjectRepository(KYCVerification)
    private kycRepository: Repository<KYCVerification>,
    @InjectRepository(KYCUploadSession)
    private uploadSessionRepository: Repository<KYCUploadSession>,
    @InjectRepository(KYCAuditLog)
    private auditLogRepository: Repository<KYCAuditLog>,
    @InjectRepository(AMLScreeningResult)
    private amlRepository: Repository<AMLScreeningResult>,
    private awsService: AWSService,
    private amlProvider: AMLProviderService,
    private webhookService: WebhookService,
    private documentProcessor: DocumentProcessorService,
  ) {}

  /**
   * Initiate a new KYC verification
   */
  async initiateKYC(dto: CreateKYCDto): Promise<KYCVerification> {
    try {
      this.logger.debug(`Initiating KYC for wallet: ${dto.walletDid}`);

      // Create KYC record
      const kyc = this.kycRepository.create({
        walletDid: dto.walletDid,
        applicantEmail: dto.applicantEmail,
        applicantName: dto.applicantName,
        status: 'initiated',
        createdAt: new Date(),
      });

      await this.kycRepository.save(kyc);

      // Log audit trail
      await this.createAuditLog(kyc.id, 'kyc_initiated', {
        walletDid: dto.walletDid,
        email: dto.applicantEmail,
      });

      // Notify wallet
      await this.webhookService.notifyVerificationStarted(kyc.id);

      this.logger.log(`KYC initiated: ${kyc.id}`);
      return kyc;
    } catch (error) {
      this.logger.error(`Error initiating KYC: ${error.message}`);
      throw error;
    }
  }

  /**
   * Create upload session for multipart uploads
   */
  async createUploadSession(kycId: string): Promise<KYCUploadSession> {
    try {
      const kyc = await this.kycRepository.findOne({ where: { id: kycId } });
      if (!kyc) throw new NotFoundException('KYC not found');

      const session = this.uploadSessionRepository.create({
        kycId,
        uploadedDocuments: 0,
        sessionExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      });

      await this.uploadSessionRepository.save(session);

      await this.createAuditLog(kycId, 'upload_session_created', {
        sessionId: session.id,
      });

      return session;
    } catch (error) {
      this.logger.error(`Error creating upload session: ${error.message}`);
      throw error;
    }
  }

  /**
   * Upload document to S3
   */
  async uploadDocument(
    kycId: string,
    documentType: DocumentType,
    file: Express.Multer.File,
  ): Promise<{ s3Key: string; documentId: string }> {
    try {
      this.logger.debug(`Uploading document: ${documentType} for KYC ${kycId}`);

      const kyc = await this.kycRepository.findOne({ where: { id: kycId } });
      if (!kyc) throw new NotFoundException('KYC not found');

      // Upload to S3
      const s3Key = await this.awsService.uploadDocument(kycId, documentType, file);

      // Store metadata
      const documentMeta = {
        documentType,
        s3Key,
        uploadedAt: new Date(),
        fileSize: file.size,
        fileName: file.originalname,
      };

      if (!kyc.documents) kyc.documents = [];
      kyc.documents.push(documentMeta);

      await this.kycRepository.save(kyc);

      // Audit log
      await this.createAuditLog(kycId, 'document_uploaded', {
        documentType,
        s3Key,
      });

      this.logger.log(`Document uploaded: ${s3Key}`);
      return { s3Key, documentId: documentMeta.fileName };
    } catch (error) {
      this.logger.error(`Error uploading document: ${error.message}`);
      throw error;
    }
  }

  /**
   * Verify KYC - orchestrate full pipeline
   */
  async verifyKYC(kycId: string): Promise<KYCResult> {
    try {
      this.logger.debug(`Starting KYC verification for ${kycId}`);

      const kyc = await this.kycRepository.findOne({ where: { id: kycId } });
      if (!kyc) throw new NotFoundException('KYC not found');

      if (!kyc.documents || kyc.documents.length === 0) {
        throw new BadRequestException('No documents uploaded');
      }

      // Extract data from documents
      const idDocData = await this.extractIDDocument(kyc);
      const selfieData = await this.extractSelfieData(kyc);

      // Perform AML screening
      const amlResult = await this.performAMLScreening(kyc, idDocData);

      // Calculate confidence scores
      const ocrConfidence = idDocData.confidence || 0;
      const facialConfidence = selfieData.facialMatch || 0;
      const livenessScore = selfieData.livenessScore || 0;

      const weights = { ocr: 0.3, facial: 0.5, liveness: 0.2 };
      const overallConfidence =
        ocrConfidence * weights.ocr +
        facialConfidence * weights.facial +
        livenessScore * weights.liveness;

      // Determine status
      let status: 'approved' | 'pending_review' | 'rejected';
      if (overallConfidence >= 0.95 && amlResult.status === 'clear') {
        status = 'approved';
      } else if (overallConfidence < 0.7 || amlResult.status === 'high_risk') {
        status = 'rejected';
      } else {
        status = 'pending_review';
      }

      // Update KYC record
      kyc.status = status;
      kyc.confidenceScore = overallConfidence;
      kyc.verificationData = {
        ocrConfidence,
        facialConfidence,
        livenessScore,
        amlStatus: amlResult.status,
        amlMatches: amlResult.matches,
      };
      kyc.verifiedAt = new Date();

      await this.kycRepository.save(kyc);

      // Audit log
      await this.createAuditLog(kycId, 'kyc_verified', {
        status,
        confidence: overallConfidence,
        amlStatus: amlResult.status,
      });

      // Notify wallet
      if (status === 'approved') {
        await this.webhookService.notifyVerificationCompleted(kycId, true, {
          confidence: overallConfidence,
        });
      } else if (status === 'pending_review') {
        await this.webhookService.notifyManualReviewRequired(kycId);
      } else {
        await this.webhookService.notifyVerificationFailed(
          kycId,
          'Verification failed: confidence score too low or AML match',
        );
      }

      const result: KYCResult = {
        kycId,
        status,
        confidence: overallConfidence,
        checks: {
          ocr_confidence: ocrConfidence,
          facial_match: facialConfidence,
          liveness_score: livenessScore,
          aml_status: amlResult.status,
        },
      };

      this.logger.log(`KYC verification completed: ${kycId}, status: ${status}`);
      return result;
    } catch (error) {
      this.logger.error(`Error verifying KYC: ${error.message}`);
      await this.webhookService.notifyVerificationFailed(kycId, error.message);
      throw error;
    }
  }

  /**
   * Extract ID document data
   */
  private async extractIDDocument(kyc: KYCVerification): Promise<any> {
    try {
      const idDoc = kyc.documents?.find(
        (d: any) => d.documentType === DocumentType.ID_DOCUMENT,
      );

      if (!idDoc) throw new BadRequestException('ID document not found');

      const result = await this.documentProcessor.processDocument(
        process.env.AWS_S3_BUCKET,
        idDoc.s3Key,
        DocumentType.ID_DOCUMENT,
      );

      return {
        ...result.extractedData,
        confidence: result.confidence,
      };
    } catch (error) {
      this.logger.error(`Error extracting ID document: ${error.message}`);
      throw error;
    }
  }

  /**
   * Extract selfie and facial recognition data
   */
  private async extractSelfieData(kyc: KYCVerification): Promise<any> {
    try {
      const selfie = kyc.documents?.find(
        (d: any) => d.documentType === 'selfie',
      );

      if (!selfie) throw new BadRequestException('Selfie not found');

      const [facialMatch, livenessScore] = await Promise.all([
        this.awsService.performFacialRecognition(selfie.s3Key),
        this.awsService.performLivenessDetection(selfie.s3Key),
      ]);

      return { facialMatch, livenessScore };
    } catch (error) {
      this.logger.error(`Error extracting selfie data: ${error.message}`);
      throw error;
    }
  }

  /**
   * Perform AML screening
   */
  private async performAMLScreening(kyc: KYCVerification, idDocData: any): Promise<any> {
    try {
      const { name, dateOfBirth } = idDocData;

      if (!name) throw new BadRequestException('Name not found in ID document');

      const screeningResult = await this.amlProvider.screenAgainstSanctions(
        name,
        new Date(dateOfBirth),
        'US', // TODO: Extract from document
      );

      // Cache result
      const amlRecord = this.amlRepository.create({
        kycId: kyc.id,
        screeningResult: screeningResult.status,
        matchDetails: screeningResult.matches,
        provider: screeningResult.provider,
      });

      await this.amlRepository.save(amlRecord);

      return screeningResult;
    } catch (error) {
      this.logger.error(`Error performing AML screening: ${error.message}`);
      return { status: 'error', matches: [] };
    }
  }

  /**
   * Get KYC status
   */
  async getKYCStatus(kycId: string): Promise<KYCVerification> {
    try {
      const kyc = await this.kycRepository.findOne({ where: { id: kycId } });
      if (!kyc) throw new NotFoundException('KYC not found');
      return kyc;
    } catch (error) {
      this.logger.error(`Error getting KYC status: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get pending manual reviews
   */
  async getPendingReviews(): Promise<KYCVerification[]> {
    try {
      const pending = await this.kycRepository.find({
        where: { status: 'pending_review' },
        order: { createdAt: 'ASC' },
      });
      return pending;
    } catch (error) {
      this.logger.error(`Error getting pending reviews: ${error.message}`);
      throw error;
    }
  }

  /**
   * Submit manual review decision
   */
  async submitManualReview(kycId: string, dto: ManualReviewDto): Promise<void> {
    try {
      this.logger.debug(`Submitting manual review for ${kycId}: ${dto.decision}`);

      const kyc = await this.kycRepository.findOne({ where: { id: kycId } });
      if (!kyc) throw new NotFoundException('KYC not found');

      // Update status based on review decision
      if (dto.decision === 'approved') {
        kyc.status = 'approved';
        kyc.reviewerNotes = dto.notes;
        kyc.approvedAt = new Date();

        // Notify wallet of approval
        await this.webhookService.notifyVerificationCompleted(kycId, true);
      } else if (dto.decision === 'rejected') {
        kyc.status = 'rejected';
        kyc.reviewerNotes = dto.notes;
        kyc.rejectedAt = new Date();

        // Notify wallet of rejection
        await this.webhookService.notifyVerificationFailed(
          kycId,
          `Manual review rejected: ${dto.notes}`,
        );
      } else if (dto.decision === 'info_requested') {
        kyc.status = 'info_requested';
        kyc.reviewerNotes = dto.notes;

        // Notify wallet that more info is needed
        const docs = dto.requestedDocuments?.split(',') || [];
        await this.webhookService.notifyManualReviewRequired(kycId, docs);
      }

      await this.kycRepository.save(kyc);

      // Audit log
      await this.createAuditLog(kycId, 'manual_review_submitted', {
        decision: dto.decision,
        notes: dto.notes,
      });

      this.logger.log(`Manual review submitted for ${kycId}: ${dto.decision}`);
    } catch (error) {
      this.logger.error(`Error submitting manual review: ${error.message}`);
      throw error;
    }
  }

  /**
   * Create audit log entry
   */
  private async createAuditLog(kycId: string, action: string, details: any): Promise<void> {
    try {
      const auditLog = this.auditLogRepository.create({
        kycId,
        action,
        details,
        timestamp: new Date(),
      });
      await this.auditLogRepository.save(auditLog);
    } catch (error) {
      this.logger.error(`Error creating audit log: ${error.message}`);
    }
  }
}
