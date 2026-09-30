import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm";

@Entity("verification_results")
export class VerificationResult {
  @PrimaryGeneratedColumn("uuid")
  id?: string;

  @Column()
  requestId?: string;

  @Column()
  holderDid?: string;

  @Column({ default: false })
  valid?: boolean;

  @Column("jsonb")
  presentationData?: Record<string, unknown>;

  @Column("jsonb", { nullable: true })
  complianceChecks?: Record<string, unknown>;

  @Column({ nullable: true })
  amlRiskScore?: number;

  @Column("text", { nullable: true })
  amlStatus?: "CLEAR" | "REVIEW" | "BLOCK";

  @CreateDateColumn()
  verifiedAt?: Date;
}
