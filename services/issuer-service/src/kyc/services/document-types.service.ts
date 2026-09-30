import { Injectable, Logger } from '@nestjs/common';

export enum DocumentType {
  ID_DOCUMENT = 'id_document',
  PASSPORT = 'passport',
  DRIVER_LICENSE = 'driver_license',
  ADDRESS_PROOF = 'address_proof',
  INCOME_VERIFICATION = 'income_verification',
  EMPLOYMENT_LETTER = 'employment_letter',
  EDUCATION_CERTIFICATE = 'education_certificate',
  BANK_STATEMENT = 'bank_statement',
  UTILITY_BILL = 'utility_bill',
  LEASE_AGREEMENT = 'lease_agreement',
}

interface DocumentExtractionResult {
  documentType: DocumentType;
  extractedData: Map<string, any>;
  confidence: number;
  warnings: string[];
}

@Injectable()
export class DocumentProcessorService {
  private logger = new Logger(DocumentProcessorService.name);

  constructor() {}

  /**
   * Process different document types
   */
  async processDocument(
    s3Bucket: string,
    s3Key: string,
    documentType: DocumentType,
  ): Promise<DocumentExtractionResult> {
    try {
      this.logger.debug(`Processing ${documentType}: ${s3Key}`);

      let result;

      switch (documentType) {
        case DocumentType.PASSPORT:
          result = await this.processPassport(s3Bucket, s3Key);
          break;

        case DocumentType.DRIVER_LICENSE:
          result = await this.processDriverLicense(s3Bucket, s3Key);
          break;

        case DocumentType.ADDRESS_PROOF:
          result = await this.processAddressProof(s3Bucket, s3Key);
          break;

        case DocumentType.INCOME_VERIFICATION:
          result = await this.processIncomeVerification(s3Bucket, s3Key);
          break;

        case DocumentType.EMPLOYMENT_LETTER:
          result = await this.processEmploymentLetter(s3Bucket, s3Key);
          break;

        case DocumentType.EDUCATION_CERTIFICATE:
          result = await this.processEducationCertificate(s3Bucket, s3Key);
          break;

        case DocumentType.BANK_STATEMENT:
          result = await this.processBankStatement(s3Bucket, s3Key);
          break;

        case DocumentType.ID_DOCUMENT:
        default:
          result = await this.processIDDocument(s3Bucket, s3Key);
          break;
      }

      return result;
    } catch (error) {
      this.logger.error(`Error processing document: ${error.message}`);
      throw error;
    }
  }

  /**
   * Process passport document
   */
  private async processPassport(
    s3Bucket: string,
    s3Key: string,
  ): Promise<DocumentExtractionResult> {
    const textData = await this.extractTextFromDocument(s3Bucket, s3Key);
    const extracted = new Map<string, any>();

    // Extract key fields for passport
    extracted.set('document_number', this.extractValue(textData, /([A-Z0-9]{6,9})/));
    extracted.set('surname', this.extractValue(textData, /Surname[:\s]+([A-Z\s]+)/));
    extracted.set('given_names', this.extractValue(textData, /Given names[:\s]+([A-Z\s]+)/));
    extracted.set('nationality', this.extractValue(textData, /Nationality[:\s]+([A-Z\s]+)/));
    extracted.set('date_of_birth', this.extractValue(textData, /(\d{1,2}\/\d{1,2}\/\d{4})/));
    extracted.set('date_of_issue', this.extractValue(textData, /Date of issue[:\s]+(\d{1,2}\/\d{1,2}\/\d{4})/));
    extracted.set('date_of_expiry', this.extractValue(textData, /Date of expiry[:\s]+(\d{1,2}\/\d{1,2}\/\d{4})/));

    const confidence = this.calculateConfidence(extracted);

    return {
      documentType: DocumentType.PASSPORT,
      extractedData: extracted,
      confidence,
      warnings: this.getPassportWarnings(extracted),
    };
  }

  /**
   * Process driver's license
   */
  private async processDriverLicense(
    s3Bucket: string,
    s3Key: string,
  ): Promise<DocumentExtractionResult> {
    const textData = await this.extractTextFromDocument(s3Bucket, s3Key);
    const extracted = new Map<string, any>();

    extracted.set('license_number', this.extractValue(textData, /License[:\s]+([A-Z0-9]+)/));
    extracted.set('name', this.extractValue(textData, /Name[:\s]+([A-Z\s]+)/));
    extracted.set('date_of_birth', this.extractValue(textData, /DOB[:\s]+(\d{1,2}\/\d{1,2}\/\d{4})/));
    extracted.set('address', this.extractValue(textData, /Address[:\s]+(.+)/));
    extracted.set('expiry_date', this.extractValue(textData, /Expires[:\s]+(\d{1,2}\/\d{1,2}\/\d{4})/));
    extracted.set('license_class', this.extractValue(textData, /Class[:\s]+([A-Z])/));

    const confidence = this.calculateConfidence(extracted);

    return {
      documentType: DocumentType.DRIVER_LICENSE,
      extractedData: extracted,
      confidence,
      warnings: this.getDriverLicenseWarnings(extracted),
    };
  }

  /**
   * Process address proof (utility bill, lease agreement, etc.)
   */
  private async processAddressProof(
    s3Bucket: string,
    s3Key: string,
  ): Promise<DocumentExtractionResult> {
    const textData = await this.extractTextFromDocument(s3Bucket, s3Key);
    const extracted = new Map<string, any>();

    extracted.set('address', this.extractAddress(textData));
    extracted.set('document_date', this.extractValue(textData, /(\d{1,2}\/\d{1,2}\/\d{4})/));
    extracted.set('recipient_name', this.extractValue(textData, /To[:\s]+([A-Z\s]+)/));
    extracted.set('document_type', this.detectDocumentType(textData));

    const confidence = this.calculateConfidence(extracted);

    return {
      documentType: DocumentType.ADDRESS_PROOF,
      extractedData: extracted,
      confidence,
      warnings: this.getAddressProofWarnings(extracted),
    };
  }

  /**
   * Process income verification
   */
  private async processIncomeVerification(
    s3Bucket: string,
    s3Key: string,
  ): Promise<DocumentExtractionResult> {
    const textData = await this.extractTextFromDocument(s3Bucket, s3Key);
    const extracted = new Map<string, any>();

    extracted.set('name', this.extractValue(textData, /Name[:\s]+([A-Z\s]+)/));
    extracted.set('annual_income', this.extractValue(textData, /Annual Income[:\s]+\$?([\d,]+)/));
    extracted.set('employer', this.extractValue(textData, /Employer[:\s]+([A-Z\s\&]+)/));
    extracted.set('position', this.extractValue(textData, /Position[:\s]+([A-Za-z\s]+)/));
    extracted.set('verification_date', this.extractValue(textData, /(\d{1,2}\/\d{1,2}\/\d{4})/));

    const confidence = this.calculateConfidence(extracted);

    return {
      documentType: DocumentType.INCOME_VERIFICATION,
      extractedData: extracted,
      confidence,
      warnings: [],
    };
  }

  /**
   * Process employment letter
   */
  private async processEmploymentLetter(
    s3Bucket: string,
    s3Key: string,
  ): Promise<DocumentExtractionResult> {
    const textData = await this.extractTextFromDocument(s3Bucket, s3Key);
    const extracted = new Map<string, any>();

    extracted.set('employee_name', this.extractValue(textData, /To[:\s]+([A-Z\s]+)/));
    extracted.set('employer', this.extractValue(textData, /From[:\s]+([A-Z\s\&]+)/));
    extracted.set('position', this.extractValue(textData, /Position[:\s]+([A-Za-z\s]+)/));
    extracted.set('start_date', this.extractValue(textData, /Since[:\s]+([A-Za-z\s]+\d{4})/));
    extracted.set('letter_date', this.extractValue(textData, /Date[:\s]+([A-Za-z\s]+\d{1,2},\s\d{4})/));
    extracted.set('has_signature', textData.includes('signature') || textData.includes('Signature'));

    const confidence = this.calculateConfidence(extracted);

    return {
      documentType: DocumentType.EMPLOYMENT_LETTER,
      extractedData: extracted,
      confidence,
      warnings: extracted.get('has_signature') ? [] : ['No signature detected'],
    };
  }

  /**
   * Process education certificate
   */
  private async processEducationCertificate(
    s3Bucket: string,
    s3Key: string,
  ): Promise<DocumentExtractionResult> {
    const textData = await this.extractTextFromDocument(s3Bucket, s3Key);
    const extracted = new Map<string, any>();

    extracted.set('student_name', this.extractValue(textData, /([A-Z][a-z]+\s[A-Z][a-z]+)/));
    extracted.set('institution', this.extractValue(textData, /[Uu]niversity|[Cc]ollege|[Ss]chool[:\s]+([A-Z\s\&]+)/));
    extracted.set('degree', this.extractValue(textData, /[Dd]egree[:\s]+([A-Za-z\s]+)/));
    extracted.set('graduation_date', this.extractValue(textData, /Graduation[:\s]+([A-Za-z\s]+\d{4})/));
    extracted.set('gpa', this.extractValue(textData, /GPA[:\s]+(\d\.\d{2})/));

    const confidence = this.calculateConfidence(extracted);

    return {
      documentType: DocumentType.EDUCATION_CERTIFICATE,
      extractedData: extracted,
      confidence,
      warnings: [],
    };
  }

  /**
   * Process bank statement
   */
  private async processBankStatement(
    s3Bucket: string,
    s3Key: string,
  ): Promise<DocumentExtractionResult> {
    const textData = await this.extractTextFromDocument(s3Bucket, s3Key);
    const extracted = new Map<string, any>();

    extracted.set('account_holder', this.extractValue(textData, /Account Holder[:\s]+([A-Z\s]+)/));
    extracted.set('account_number', this.extractValue(textData, /Account[:\s]+([A-Z0-9]+)/));
    extracted.set('bank_name', this.extractValue(textData, /Bank[:\s]+([A-Z\s\&]+)/));
    extracted.set('statement_period', this.extractValue(textData, /Period[:\s]+([A-Za-z\s0-9,]+)/));
    extracted.set('balance', this.extractValue(textData, /Balance[:\s]+\$?([\d,\.]+)/));

    const confidence = this.calculateConfidence(extracted);

    return {
      documentType: DocumentType.BANK_STATEMENT,
      extractedData: extracted,
      confidence,
      warnings: [],
    };
  }

  /**
   * Process generic ID document (fallback)
   */
  private async processIDDocument(
    s3Bucket: string,
    s3Key: string,
  ): Promise<DocumentExtractionResult> {
    const textData = await this.extractTextFromDocument(s3Bucket, s3Key);
    const extracted = new Map<string, any>();

    extracted.set('name', this.extractValue(textData, /Name[:\s]+([A-Z\s]+)/));
    extracted.set('id_number', this.extractValue(textData, /ID[:\s]+([A-Z0-9\-]+)/));
    extracted.set('date_of_birth', this.extractValue(textData, /Born[:\s]+(\d{1,2}\/\d{1,2}\/\d{4})/));

    const confidence = this.calculateConfidence(extracted);

    return {
      documentType: DocumentType.ID_DOCUMENT,
      extractedData: extracted,
      confidence,
      warnings: [],
    };
  }

  /**
   * Extract text from document using Textract
   */
  private async extractTextFromDocument(s3Bucket: string, s3Key: string): Promise<string> {
    try {
      // In production, call AWS Textract
      // const response = await this.textractClient.detectDocumentText({
      //   Document: {
      //     S3Object: { Bucket: s3Bucket, Name: s3Key },
      //   },
      // });
      // return response.Blocks?.map(b => b.Text).join(' ') || '';

      // Mock implementation for development
      return `Sample document text for ${s3Key}`;
    } catch (error) {
      this.logger.error(`Error extracting text: ${error.message}`);
      throw error;
    }
  }

  /**
   * Extract specific value from text using regex
   */
  private extractValue(text: string, regex: RegExp): string | null {
    const match = text.match(regex);
    return match ? match[1] : null;
  }

  /**
   * Extract address from text
   */
  private extractAddress(text: string): string | null {
    const addressPatterns = [
      /(\d+\s+[A-Za-z\s]+,\s+[A-Za-z]{2}\s+\d{5})/,
      /Address[:\s]+([^,\n]+)/,
    ];

    for (const pattern of addressPatterns) {
      const match = text.match(pattern);
      if (match) return match[1];
    }

    return null;
  }

  /**
   * Detect document type from content
   */
  private detectDocumentType(text: string): string {
    if (text.includes('utility') || text.includes('power')) return 'utility_bill';
    if (text.includes('bank')) return 'bank_statement';
    if (text.includes('lease') || text.includes('landlord')) return 'lease_agreement';
    if (text.includes('mortgage')) return 'mortgage_statement';
    return 'other';
  }

  /**
   * Calculate confidence score based on extracted fields
   */
  private calculateConfidence(extracted: Map<string, any>): number {
    const totalFields = extracted.size;
    let filledFields = 0;

    extracted.forEach((value) => {
      if (value !== null && value !== undefined && value !== '') {
        filledFields++;
      }
    });

    return totalFields > 0 ? filledFields / totalFields : 0;
  }

  /**
   * Get warnings for passport
   */
  private getPassportWarnings(extracted: Map<string, any>): string[] {
    const warnings: string[] = [];

    const expiryDate = extracted.get('date_of_expiry');
    if (expiryDate) {
      const expiry = new Date(expiryDate);
      if (expiry < new Date()) {
        warnings.push('Passport has expired');
      }
    }

    return warnings;
  }

  /**
   * Get warnings for driver license
   */
  private getDriverLicenseWarnings(extracted: Map<string, any>): string[] {
    const warnings: string[] = [];

    const expiryDate = extracted.get('expiry_date');
    if (expiryDate) {
      const expiry = new Date(expiryDate);
      if (expiry < new Date()) {
        warnings.push('Driver license has expired');
      }
    }

    return warnings;
  }

  /**
   * Get warnings for address proof
   */
  private getAddressProofWarnings(extracted: Map<string, any>): string[] {
    const warnings: string[] = [];

    const docDate = extracted.get('document_date');
    if (docDate) {
      const docDateObj = new Date(docDate);
      const monthsOld = (Date.now() - docDateObj.getTime()) / (1000 * 60 * 60 * 24 * 30);
      if (monthsOld > 3) {
        warnings.push('Document is older than 3 months');
      }
    }

    return warnings;
  }
}
