import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, MoreThanOrEqual } from "typeorm";
import { NotificationMessage } from "../entities/notification-message.entity";
import { DIDCommService } from "./didcomm.service";
import { PushService } from "./push.service";
import { AMLRefreshRequest } from "@kyc-vault/common-types";
import { v4 as uuidv4 } from "uuid";

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(NotificationMessage)
    private readonly messageRepository: Repository<NotificationMessage>,
    private readonly didcommService: DIDCommService,
    private readonly pushService: PushService
  ) {}

  async sendPushNotification(payload: {
    recipientDid: string;
    title: string;
    body: string;
    data?: Record<string, unknown>;
    fcmToken?: string;
  }): Promise<NotificationMessage> {
    const message = this.messageRepository.create({
      recipientDid: payload.recipientDid,
      type: "push_notification",
      payload: {
        title: payload.title,
        body: payload.body,
        data: payload.data,
      },
      fcmToken: payload.fcmToken,
      status: "pending",
    });

    const saved = await this.messageRepository.save(message);

    // Attempt to send via FCM if token provided
    if (payload.fcmToken) {
      const success = await this.pushService.sendFCMNotification(
        payload.fcmToken,
        payload.title,
        payload.body,
        payload.data as Record<string, string>
      );

      if (success) {
        saved.status = "delivered";
        saved.deliveredAt = new Date();
        await this.messageRepository.save(saved);
      }
    }

    return saved;
  }

  async sendAMLRefreshRequest(payload: AMLRefreshRequest): Promise<NotificationMessage> {
    const encryptedPayload = await this.didcommService.encryptMessage(
      payload.holderDid,
      payload as unknown as Record<string, unknown>
    );

    const message = this.messageRepository.create({
      recipientDid: payload.holderDid,
      type: "aml_refresh",
      payload: payload as unknown as Record<string, unknown>,
      encrypted: payload.didcommEncrypted || false,
      status: "pending",
    });

    return await this.messageRepository.save(message);
  }

  async getMessages(
    recipientDid: string,
    limit: number = 50
  ): Promise<NotificationMessage[]> {
    return await this.messageRepository.find({
      where: { recipientDid },
      order: { createdAt: "DESC" },
      take: limit,
    });
  }

  async getPendingMessages(recipientDid: string): Promise<NotificationMessage[]> {
    return await this.messageRepository.find({
      where: { recipientDid, status: "pending" },
      order: { createdAt: "ASC" },
    });
  }

  async markAsRead(messageId: string): Promise<void> {
    await this.messageRepository.update(messageId, {
      status: "delivered",
      deliveredAt: new Date(),
    });
  }
}
