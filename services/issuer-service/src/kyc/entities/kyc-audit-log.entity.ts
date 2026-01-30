import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('kyc_audit_log')
export class KYCAuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  kycId: string;

  @Column()
  action: string;

  @Column({ type: 'simple-json', nullable: true })
  details: Record<string, any>;

  @CreateDateColumn()
  timestamp: Date;

  @Column({ nullable: true })
  userId: string;
}
