import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('aml_screening_results')
export class AMLScreeningResult {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  kycId: string;

  @Column({
    type: 'varchar',
    enum: ['clear', 'alert', 'high_risk', 'error'],
  })
  screeningResult: string;

  @Column({ type: 'simple-json', nullable: true })
  matchDetails: Record<string, any>[];

  @Column()
  provider: string;

  @CreateDateColumn()
  screeningDate: Date;

  @Column({ type: 'float', nullable: true })
  riskScore: number;

  @Column({ nullable: true })
  reviewNotes: string;

  @Column({ default: false })
  isFalsePositive: boolean;
}
