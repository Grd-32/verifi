import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm";

@Entity("issuance_logs")
export class IssuanceLog {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  templateId!: string;

  @Column()
  subjectDid!: string;

  @Column()
  credentialId!: string;

  @Column("jsonb")
  claims!: Record<string, unknown>;

  @Column({ default: "issued" })
  status!: "issued" | "accepted" | "rejected";

  @CreateDateColumn()
  issuedAt!: Date;

  @Column({ nullable: true })
  acceptedAt!: Date;
}
