import { IsNotEmpty, IsObject } from "class-validator";

export class CreateTemplateDto {
  @IsNotEmpty()
  name!: string;

  @IsObject()
  schema!: Record<string, unknown>;

  @IsNotEmpty()
  issuerDid!: string;

  description?: string;
}
