import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm";
import { AMLRefreshRequest } from "@kyc-vault/common-types";

@Entity("notification_messages")
export class NotificationMessage {
  @PrimaryGeneratedColumn("uuid")
  id?: string;

  @Column()
  recipientDid?: string;

  @Column({ type: "enum", enum: ["push_notification", "aml_refresh", "credential_revocation"] })
  type?: string;

  @Column("jsonb")
  payload?: Record<string, unknown>;

  @Column({ default: "pending" })
  status?: "pending" | "sent" | "delivered" | "failed";

  @Column({ nullable: true })
  fcmToken?: string;

  @Column({ default: false })
  encrypted?: boolean;

  @CreateDateColumn()
  createdAt?: Date;

  @Column({ nullable: true })
  deliveredAt?: Date;
}
