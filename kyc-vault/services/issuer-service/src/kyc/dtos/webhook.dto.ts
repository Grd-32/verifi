import { IsString, IsUrl, IsOptional } from 'class-validator';

export class CreateWebhookDto {
  @IsString()
  walletDid: string;

  @IsUrl()
  webhookUrl: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class ManualReviewDto {
  @IsString()
  decision: 'approved' | 'rejected' | 'info_requested';

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  requestedDocuments?: string;
}
