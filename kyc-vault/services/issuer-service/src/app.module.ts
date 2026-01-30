import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AdminController } from "./controllers/admin.controller";

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
