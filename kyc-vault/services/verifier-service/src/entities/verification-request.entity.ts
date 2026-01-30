import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm";

@Entity("verification_requests")
export class VerificationRequest {
  @PrimaryGeneratedColumn("uuid")
  id?: string;

  @Column()
  verifierDid?: string;

  @Column("jsonb")
  requestedCredentials?: Array<{ type: string; fields: string[] }>;

  @Column()
  purpose?: string;

  @Column()
  nonce?: string;

  @Column({ default: "pending" })
  status?: "pending" | "presented" | "verified" | "rejected" | "expired";

  @CreateDateColumn()
  createdAt?: Date;

  @Column({ nullable: true })
  expiresAt?: Date;
}
