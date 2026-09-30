import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { VerificationController } from "./controllers/verification.controller";
import { AdminController } from "./controllers/admin.controller";
import { VerificationService } from "./services/verification.service";
import { ComplianceService } from "./services/compliance.service";

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
