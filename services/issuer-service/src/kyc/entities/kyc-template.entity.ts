import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('kyc_templates')
export class KYCTemplate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ type: 'simple-json' })
  requiredDocuments: string[];

  @Column({ type: 'simple-json' })
  workflowSteps: Array<{
    step: number;
    type: string;
    config: Record<string, any>;
  }>;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ default: true })
  isActive: boolean;
}
