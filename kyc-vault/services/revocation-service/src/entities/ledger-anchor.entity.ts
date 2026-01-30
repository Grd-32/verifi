import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm";

@Entity("ledger_anchors")
export class LedgerAnchor {
  @PrimaryGeneratedColumn("uuid")
  id?: string;

  @Column()
  ledger?: "cheqd" | "ion" | "ethr" | "mock";

  @Column()
  registryId?: string;

  @Column()
  txId?: string;

  @Column({ nullable: true })
  blockNumber?: number;

  @Column()
  status?: "pending" | "confirmed" | "failed";

  @Column({ nullable: true })
  url?: string;

  @CreateDateColumn()
  anchoredAt?: Date;
}
