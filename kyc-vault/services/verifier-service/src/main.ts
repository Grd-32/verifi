import { NestFactory } from "@nestjs/core";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle("Verifier Service API")
    .setDescription("Request and verify presentations, AML/KYC compliance")
    .setVersion("1.0")
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("docs", app, document);

  const port = 3003;
  await app.listen(port);
  console.log(`✓ Verifier Service running on http://localhost:${port}`);
  console.log(`✓ Admin Dashboard available at http://localhost:${port}/admin`);
  console.log(`✓ API docs available at http://localhost:${port}/docs`);
}

bootstrap().catch((error) => {
  console.error("Failed to start Verifier Service:", error);
  process.exit(1);
});
