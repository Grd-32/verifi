import { Controller, Post, Get, Body, Param } from "@nestjs/common";
import { TemplateService } from "../services/template.service";
import { CreateTemplateDto } from "../dtos/create-template.dto";
import { ApiResponse } from "@kyc-vault/common-types";

@Controller("api/issuer/templates")
export class TemplateController {
  constructor(private readonly templateService: TemplateService) {}

  @Post()
  async createTemplate(@Body() dto: CreateTemplateDto) {
    const template = await this.templateService.createTemplate(dto);
    return {
      success: true,
      data: template,
      timestamp: new Date().toISOString(),
    } as ApiResponse;
  }

  @Get(":issuerDid")
  async getTemplates(@Param("issuerDid") issuerDid: string) {
    const templates = await this.templateService.getTemplates(issuerDid);
    return {
      success: true,
      data: templates,
      timestamp: new Date().toISOString(),
    } as ApiResponse;
  }

  @Get(":id/details")
  async getTemplate(@Param("id") id: string) {
    const template = await this.templateService.getTemplate(id);
    return {
      success: true,
      data: template,
      timestamp: new Date().toISOString(),
    } as ApiResponse;
  }
}
