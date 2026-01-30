import { NestFactory } from "@nestjs/core";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle("Notification Service API")
    .setDescription("DIDComm messaging, push notifications, AML refresh requests")
    .setVersion("1.0")
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("docs", app, document);

  const port = 3004;
  await app.listen(port);
  console.log(`✓ Notification Service running on http://localhost:${port}`);
  console.log(`✓ Admin Dashboard available at http://localhost:${port}/admin`);
  console.log(`✓ API docs available at http://localhost:${port}/docs`);
}

bootstrap().catch((error) => {
  console.error("Failed to start Notification Service:", error);
  process.exit(1);
});
