import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm";

@Entity("credential_templates")
export class CredentialTemplate {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  name!: string;

  @Column("jsonb")
  schema!: Record<string, unknown>;

  @Column()
  issuerDid!: string;

  @Column("text", { nullable: true })
  description!: string;

  @Column({ default: true })
  active!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @Column({ nullable: true })
  updatedAt!: Date;
}
