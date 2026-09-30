import { NestFactory } from "@nestjs/core";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle("Revocation Service API")
    .setDescription("Credential revocation registry and ledger anchoring")
    .setVersion("1.0")
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("docs", app, document);

  const port = 3005;
  await app.listen(port);
  console.log(`✓ Revocation Service running on http://localhost:${port}`);
  console.log(`✓ Admin Dashboard available at http://localhost:${port}/admin`);
  console.log(`✓ API docs available at http://localhost:${port}/docs`);
}

bootstrap().catch((error) => {
  console.error("Failed to start Revocation Service:", error);
  process.exit(1);
});
