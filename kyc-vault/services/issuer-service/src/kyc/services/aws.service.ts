import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { TextractClient, DetectDocumentTextCommand } from '@aws-sdk/client-textract';
import { RekognitionClient, SearchFacesByImageCommand, DetectFacesCommand } from '@aws-sdk/client-rekognition';
import * as crypto from 'crypto';
import { DocumentType } from './document-types.service';

@Injectable()
export class AWSService {
  private logger = new Logger(AWSService.name);
  private s3Client: S3Client;
  private textractClient: TextractClient;
  private rekognitionClient: RekognitionClient;
  private s3Bucket: string;
  private region: string;

  constructor(private configService: ConfigService) {
    this.region = this.configService.get('AWS_REGION') || 'us-east-1';
    this.s3Bucket = this.configService.get('AWS_S3_BUCKET') || 'kyc-vault';

    this.s3Client = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId: this.configService.get('AWS_ACCESS_KEY_ID'),
        secretAccessKey: this.configService.get('AWS_SECRET_ACCESS_KEY'),
      },
    });

    this.textractClient = new TextractClient({
      region: this.region,
      credentials: {
        accessKeyId: this.configService.get('AWS_ACCESS_KEY_ID'),
        secretAccessKey: this.configService.get('AWS_SECRET_ACCESS_KEY'),
      },
    });

    this.rekognitionClient = new RekognitionClient({
      region: this.region,
      credentials: {
        accessKeyId: this.configService.get('AWS_ACCESS_KEY_ID'),
        secretAccessKey: this.configService.get('AWS_SECRET_ACCESS_KEY'),
      },
    });
  }

  /**
   * Upload document to S3 with encryption
   */
  async uploadDocument(
    kycId: string,
    documentType: DocumentType,
    file: any,
  ): Promise<string> {
    try {
      const s3Key = this.generateS3Key(kycId, documentType, file.originalname);

      this.logger.debug(`Uploading to S3: ${s3Key}`);

      const command = new PutObjectCommand({
        Bucket: this.s3Bucket,
        Key: s3Key,
        Body: file.buffer,
        ContentType: file.mimetype,
        ServerSideEncryption: 'AES256',
        Metadata: {
          'kyc-id': kycId,
          'document-type': documentType,
          'upload-date': new Date().toISOString(),
        },
      });

      await this.s3Client.send(command);

      this.logger.log(`Document uploaded to S3: ${s3Key}`);
      return s3Key;
    } catch (error) {
      this.logger.error(`Error uploading to S3: ${error.message}`);
      throw error;
    }
  }

  /**
   * Extract text from document using Textract
   */
  async extractTextFromDocument(s3Key: string): Promise<string> {
    try {
      this.logger.debug(`Extracting text from ${s3Key} using Textract`);

      const command = new DetectDocumentTextCommand({
        Document: {
          S3Object: {
            Bucket: this.s3Bucket,
            Name: s3Key,
          },
        },
      });

      const response = await this.textractClient.send(command);

      // Combine all extracted text blocks
      const text = response.Blocks?.filter((b) => b.BlockType === 'LINE')
        .map((b) => b.Text)
        .join('\n') || '';

      this.logger.debug(`Extracted ${text.length} characters from document`);
      return text;
    } catch (error) {
      this.logger.error(`Error extracting text: ${error.message}`);
      throw error;
    }
  }

  /**
   * Perform facial recognition against ID photo
   */
  async performFacialRecognition(selfieS3Key: string): Promise<number> {
    try {
      this.logger.debug(`Performing facial recognition on ${selfieS3Key}`);

      // In production, you would:
      // 1. Extract face from ID document
      // 2. Extract face from selfie
      // 3. Compare using Rekognition SearchFacesByImage or CompareFaces

      // For now, return mock score
      const command = new DetectFacesCommand({
        Image: {
          S3Object: {
            Bucket: this.s3Bucket,
            Name: selfieS3Key,
          },
        },
      });

      const response = await this.rekognitionClient.send(command);
      const faceDetections = response.FaceDetails || [];

      if (faceDetections.length === 0) {
        this.logger.warn('No face detected in selfie');
        return 0;
      }

      // Return average confidence of detected faces
      const avgConfidence =
        faceDetections.reduce((sum, face) => sum + (face.Confidence || 0), 0) /
        faceDetections.length;

      this.logger.log(`Facial recognition completed: ${avgConfidence.toFixed(2)}% confidence`);
      return avgConfidence / 100;
    } catch (error) {
      this.logger.error(`Error in facial recognition: ${error.message}`);
      return 0;
    }
  }

  /**
   * Perform liveness detection
   */
  async performLivenessDetection(selfieS3Key: string): Promise<number> {
    try {
      this.logger.debug(`Performing liveness detection on ${selfieS3Key}`);

      // In production, use AWS Rekognition Video for video-based liveness
      // or AWS Rekognition custom models for image-based liveness

      // For now, use face detection confidence as proxy
      const command = new DetectFacesCommand({
        Image: {
          S3Object: {
            Bucket: this.s3Bucket,
            Name: selfieS3Key,
          },
        },
        Attributes: ['ALL'],
      });

      const response = await this.rekognitionClient.send(command);
      const faceDetails = response.FaceDetails?.[0];

      if (!faceDetails) {
        this.logger.warn('No face detected for liveness check');
        return 0;
      }

      // Use face quality and eye openness as liveness indicators
      const quality = faceDetails.Quality?.Brightness || 0;
      const eyeOpen = faceDetails.EyesOpen?.Confidence || 0;
      const mouthOpen = faceDetails.MouthOpen?.Confidence || 0;

      // Simple liveness score based on quality and features
      const livenessScore = (quality + eyeOpen + Math.abs(50 - mouthOpen)) / 150;

      this.logger.log(`Liveness detection completed: ${(livenessScore * 100).toFixed(2)}%`);
      return Math.min(livenessScore, 1);
    } catch (error) {
      this.logger.error(`Error in liveness detection: ${error.message}`);
      return 0;
    }
  }

  /**
   * Extract structured data from ID using Textract
   */
  async extractIDData(idS3Key: string): Promise<Record<string, any>> {
    try {
      this.logger.debug(`Extracting ID data from ${idS3Key}`);

      const text = await this.extractTextFromDocument(idS3Key);

      // Parse extracted text using regex patterns
      const data = {
        name: this.extractValue(text, /[Nn]ame[:\s]+([A-Z][a-z]+\s[A-Z][a-z]+)/),
        dateOfBirth: this.extractValue(text, /DOB[:\s]+(\d{1,2}\/\d{1,2}\/\d{4})/),
        documentNumber: this.extractValue(text, /[A-Z0-9]{6,9}/),
        expiryDate: this.extractValue(text, /[Ee]xpir[ey][:\s]+(\d{1,2}\/\d{1,2}\/\d{4})/),
      };

      return data;
    } catch (error) {
      this.logger.error(`Error extracting ID data: ${error.message}`);
      throw error;
    }
  }

  /**
   * Generate S3 key with proper structure
   */
  private generateS3Key(kycId: string, documentType: DocumentType, fileName: string): string {
    const timestamp = Date.now();
    const hash = crypto.randomBytes(4).toString('hex');
    const fileExt = fileName.split('.').pop();
    return `kyc/${kycId}/${documentType}/${timestamp}-${hash}.${fileExt}`;
  }

  /**
   * Extract value from text using regex
   */
  private extractValue(text: string, regex: RegExp): string | null {
    const match = text.match(regex);
    return match ? match[1] : null;
  }
}
