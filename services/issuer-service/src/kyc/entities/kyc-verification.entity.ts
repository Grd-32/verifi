import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('kyc_verifications')
@Index(['walletDid'])
@Index(['status'])
export class KYCVerification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  walletDid: string;

  @Column()
  applicantEmail: string;

  @Column({ nullable: true })
  applicantName: string;

  @Column({ nullable: true })
  applicantPhone: string;

  @Column({
    type: 'varchar',
    default: 'initiated',
    enum: [
      'initiated',
      'documents_uploaded',
      'processing',
      'pending_review',
      'approved',
      'rejected',
      'info_requested',
    ],
  })
  status: string;

  @Column({ type: 'simple-json', nullable: true })
  documents: Array<{
    documentType: string;
    s3Key: string;
    uploadedAt: Date;
    fileSize: number;
    fileName: string;
  }>;

  @Column({ type: 'float', nullable: true })
  confidenceScore: number;

  @Column({ type: 'simple-json', nullable: true })
  verificationData: {
    ocrConfidence: number;
    facialConfidence: number;
    livenessScore: number;
    amlStatus: string;
    amlMatches: any[];
  };

  @Column({ nullable: true })
  reviewerNotes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  verifiedAt: Date;

  @Column({ nullable: true })
  approvedAt: Date;

  @Column({ nullable: true })
  rejectedAt: Date;

  @Column({ nullable: true })
  issuedCredentialId: string;
}
