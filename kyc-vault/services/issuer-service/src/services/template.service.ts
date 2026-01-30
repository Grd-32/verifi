import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CredentialTemplate } from "../entities/credential-template.entity";
import { CreateTemplateDto } from "../dtos/create-template.dto";

@Injectable()
export class TemplateService {
  constructor(
    @InjectRepository(CredentialTemplate)
    private readonly templateRepository: Repository<CredentialTemplate>
  ) {}

  async createTemplate(dto: CreateTemplateDto): Promise<CredentialTemplate> {
    const template = this.templateRepository.create(dto);
    return await this.templateRepository.save(template);
  }

  async getTemplates(issuerDid: string): Promise<CredentialTemplate[]> {
    return await this.templateRepository.find({
      where: { issuerDid, active: true },
    });
  }

  async getTemplate(id: string): Promise<CredentialTemplate | null> {
    return await this.templateRepository.findOne({ where: { id } });
  }

  async updateTemplate(
    id: string,
    updates: Partial<CredentialTemplate>
  ): Promise<CredentialTemplate> {
    await this.templateRepository.update(id, updates as any);
    return (await this.templateRepository.findOne({ where: { id } })) as CredentialTemplate;
  }

  async deleteTemplate(id: string): Promise<void> {
    await this.templateRepository.update(id, { active: false });
  }
}
