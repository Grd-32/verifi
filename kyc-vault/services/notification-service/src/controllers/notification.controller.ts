import { Controller, Post, Get, Body, Param } from "@nestjs/common";
import { NotificationService } from "../services/notification.service";
import { ApiResponse, AMLRefreshRequest, PaginatedResponse } from "@kyc-vault/common-types";

@Controller("api/notify")
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Post("push")
  async sendPush(
    @Body()
    payload: {
      recipientDid: string;
      title: string;
      body: string;
      data?: Record<string, unknown>;
      fcmToken?: string;
    }
  ) {
    const message = await this.notificationService.sendPushNotification(payload);
    return {
      success: true,
      data: message,
      timestamp: new Date().toISOString(),
    } as ApiResponse;
  }

  @Post("aml-refresh")
  async sendAMLRefresh(@Body() payload: AMLRefreshRequest) {
    const message = await this.notificationService.sendAMLRefreshRequest(payload);
    return {
      success: true,
      data: message,
      timestamp: new Date().toISOString(),
    } as ApiResponse;
  }

  @Get("messages/:recipientDid")
  async getMessages(
    @Param("recipientDid") recipientDid: string
  ) {
    const messages = await this.notificationService.getMessages(recipientDid);
    return {
      success: true,
      data: messages,
      timestamp: new Date().toISOString(),
    } as ApiResponse;
  }

  @Get("pending/:recipientDid")
  async getPending(@Param("recipientDid") recipientDid: string) {
    const messages = await this.notificationService.getPendingMessages(recipientDid);
    return {
      success: true,
      data: messages,
      timestamp: new Date().toISOString(),
    } as ApiResponse;
  }
}
