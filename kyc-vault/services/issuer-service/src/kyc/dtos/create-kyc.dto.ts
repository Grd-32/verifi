import { IsString, IsEmail, IsOptional } from 'class-validator';

export class CreateKYCDto {
  @IsString()
  walletDid: string;

  @IsEmail()
  applicantEmail: string;

  @IsOptional()
  @IsString()
  applicantName?: string;

  @IsOptional()
  @IsString()
  applicantPhone?: string;

  @IsOptional()
  @IsString()
  country?: string;
}
