import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm";

@Entity("revocation_registry")
export class RevocationRegistry {
  @PrimaryGeneratedColumn("uuid")
  id?: string;

  @Column()
  credentialId?: string;

  @Column()
  issuerDid?: string;

  @Column({ default: false })
  revoked?: boolean;

  @Column({ nullable: true })
  revokedAt?: Date;

  @Column({ type: "text", nullable: true })
  reason?: string;

  @Column()
  registryId?: string;

  @CreateDateColumn()
  createdAt?: Date;
}
