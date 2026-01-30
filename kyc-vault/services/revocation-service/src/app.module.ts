import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { RevocationController } from "./controllers/revocation.controller";
import { AdminController } from "./controllers/admin.controller";
import { RevocationService } from "./services/revocation.service";
import { LedgerService } from "./services/ledger.service";

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
