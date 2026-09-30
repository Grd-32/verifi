import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { KYCService } from './services/kyc.service';
import { AWSService } from './services/aws.service';
import { AMLProviderService } from './services/aml-provider.service';
import { WebhookService } from './services/webhook.service';
import { DocumentProcessorService } from './services/document-types.service';
import { KYCController } from './controllers/kyc.controller';
import { KYCVerification } from './entities/kyc-verification.entity';
import { KYCUploadSession } from './entities/kyc-upload-session.entity';
import { KYCAuditLog } from './entities/kyc-audit-log.entity';
import { KYCTemplate } from './entities/kyc-template.entity';
import { AMLScreeningResult } from './entities/aml-screening-result.entity';
import { WebhookEndpoint } from './entities/webhook-endpoint.entity';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([
      KYCVerification,
      KYCUploadSession,
      KYCAuditLog,
      KYCTemplate,
      AMLScreeningResult,
      WebhookEndpoint,
    ]),
  ],
  providers: [
    KYCService,
    AWSService,
    AMLProviderService,
    WebhookService,
    DocumentProcessorService,
  ],
  controllers: [KYCController],
  exports: [KYCService, WebhookService],
})
export class KYCModule {}
