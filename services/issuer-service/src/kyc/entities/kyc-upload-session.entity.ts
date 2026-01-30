import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('kyc_upload_sessions')
export class KYCUploadSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  kycId: string;

  @Column({ default: 0 })
  uploadedDocuments: number;

  @CreateDateColumn()
  createdAt: Date;

  @Column()
  sessionExpiry: Date;

  @Column({ default: true })
  isActive: boolean;
}
