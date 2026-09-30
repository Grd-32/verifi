import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('webhook_endpoints')
@Index(['walletDid'])
@Index(['isActive'])
export class WebhookEndpoint {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  walletDid: string;

  @Column()
  webhookUrl: string;

  @Column()
  secret: string; // HMAC secret for signing

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  description: string;

  @Column({ default: 0 })
  failureCount: number;

  @Column({ nullable: true })
  lastDeliveredAt: Date;

  @Column({ nullable: true })
  lastError: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  deactivatedAt: Date;
}
