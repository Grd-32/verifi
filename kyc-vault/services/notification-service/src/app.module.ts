import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { NotificationController } from "./controllers/notification.controller";
import { AdminController } from "./controllers/admin.controller";
import { NotificationService } from "./services/notification.service";
import { DIDCommService } from "./services/didcomm.service";
import { PushService } from "./services/push.service";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
  ],
  controllers: [AdminController],
  providers: [],
})
export class AppModule {}
