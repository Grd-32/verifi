import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm";

@Entity("revocation_logs")
export class RevocationLog {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  credentialId!: string;

  @Column()
  issuerDid!: string;

  @Column({ type: "text", nullable: true })
  reason!: string;

  @CreateDateColumn()
  revokedAt!: Date;

  @Column("jsonb", { nullable: true })
  ledgerAnchoring!: Record<string, unknown>;
}
