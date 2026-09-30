import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

interface OFACMatch {
  entityName: string;
  matchScore: number;
  listType: string;
  country?: string;
}

@Injectable()
export class AMLProviderService {
  private logger = new Logger(AMLProviderService.name);
  private sanctionScannerClient: AxiosInstance;
  private ofacProvider: string;

  constructor(private configService: ConfigService) {
    // Initialize Sanction Scanner client (or your preferred AML provider)
    const apiKey = this.configService.get('SANCTION_SCANNER_API_KEY');
    
    if (apiKey) {
      this.sanctionScannerClient = axios.create({
        baseURL: 'https://api.sanctionscanner.com/v1',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      });
    }

    this.ofacProvider = this.configService.get('AML_PROVIDER') || 'sanction-scanner';
  }

  /**
   * Screen individual against sanctions lists
   * Integrates with real AML providers like Sanction Scanner or OpenSanctions
   */
  async screenAgainstSanctions(
    fullName: string,
    dateOfBirth: Date,
    country: string,
  ): Promise<any> {
    try {
      this.logger.debug(
        `Screening ${fullName} against sanctions lists (Provider: ${this.ofacProvider})`,
      );

      let result;

      if (this.ofacProvider === 'sanction-scanner') {
        result = await this.screenViaSanctionScanner(fullName, dateOfBirth, country);
      } else if (this.ofacProvider === 'opensanctions') {
        result = await this.screenViaOpenSanctions(fullName, dateOfBirth, country);
      } else {
        // Fallback to mock implementation
        result = this.mockScreening(fullName, dateOfBirth, country);
      }

      this.logger.debug(`Screening result: ${JSON.stringify(result)}`);
      return result;
    } catch (error) {
      this.logger.error(`Error screening sanctions: ${error.message}`);
      // Return mock on error to prevent blocking
      return {
        status: 'error',
        message: error.message,
        matches: [],
        provider: this.ofacProvider,
      };
    }
  }

  /**
   * Screen via Sanction Scanner API
   * https://sanctionscanner.com/
   */
  private async screenViaSanctionScanner(
    fullName: string,
    dateOfBirth: Date,
    country: string,
  ): Promise<any> {
    try {
      const response = await this.sanctionScannerClient.post('/individual-screening', {
        name: fullName,
        birth_date: dateOfBirth.toISOString().split('T')[0],
        country: country,
        document_type: 'PASSPORT', // Could be parameterized
      });

      const matches = response.data.match_result || [];
      const riskLevel = this.calculateRiskLevel(matches);

      return {
        status: riskLevel === 'clear' ? 'clear' : riskLevel === 'alert' ? 'alert' : 'high_risk',
        matches,
        provider: 'sanction-scanner',
        timestamp: new Date(),
        screeners: ['ofac', 'eu_sanctions', 'un_list', 'interpol'],
      };
    } catch (error: any) {
      this.logger.error(`Sanction Scanner API error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Screen via OpenSanctions API
   * https://opensanctions.org/
   */
  private async screenViaOpenSanctions(
    fullName: string,
    dateOfBirth: Date,
    country: string,
  ): Promise<any> {
    try {
      const response = await axios.get('https://api.opensanctions.org/entities', {
        params: {
          q: fullName,
          datasets: 'ofac,eu_fsf,un_sc_sanctions,interpol',
          limit: 10,
        },
        timeout: 10000,
      });

      const entities = response.data.results || [];
      const matches = entities
        .filter((entity: any) => this.calculateNameSimilarity(fullName, entity.name) > 0.7)
        .map((entity: any) => ({
          name: entity.name,
          type: entity.schema,
          datasets: entity.datasets,
          matchScore: this.calculateNameSimilarity(fullName, entity.name),
        }));

      const riskLevel = matches.length > 0 ? 'alert' : 'clear';

      return {
        status: riskLevel,
        matches,
        provider: 'opensanctions',
        timestamp: new Date(),
        screeners: ['ofac', 'eu_fsf', 'un_sc_sanctions', 'interpol'],
      };
    } catch (error: any) {
      this.logger.error(`OpenSanctions API error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Mock screening for development/testing
   */
  private mockScreening(fullName: string, dateOfBirth: Date, country: string): any {
    // Simple pattern matching for testing
    const highRiskPatterns = ['fake', 'test', 'demo', 'sanction'];
    const isHighRisk = highRiskPatterns.some(pattern =>
      fullName.toLowerCase().includes(pattern),
    );

    return {
      status: isHighRisk ? 'alert' : 'clear',
      matches: isHighRisk
        ? [
            {
              name: fullName,
              type: 'PERSON',
              listType: 'TEST_PATTERN',
              matchScore: 0.5,
            },
          ]
        : [],
      provider: 'mock',
      timestamp: new Date(),
      screeners: ['ofac', 'eu_sanctions', 'un_list'],
    };
  }

  /**
   * Calculate risk level from matches
   */
  private calculateRiskLevel(matches: any[]): 'clear' | 'alert' | 'high_risk' {
    if (matches.length === 0) return 'clear';
    
    const highConfidenceMatches = matches.filter((m: any) => m.match_score > 90);
    if (highConfidenceMatches.length > 0) return 'high_risk';
    
    return 'alert';
  }

  /**
   * Calculate name similarity (Levenshtein distance)
   */
  private calculateNameSimilarity(name1: string, name2: string): number {
    const n1 = name1.toLowerCase();
    const n2 = name2.toLowerCase();
    
    if (n1 === n2) return 1;
    
    const distance = this.levenshteinDistance(n1, n2);
    const maxLength = Math.max(n1.length, n2.length);
    
    return 1 - distance / maxLength;
  }

  /**
   * Levenshtein distance algorithm
   */
  private levenshteinDistance(s1: string, s2: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= s2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= s1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= s2.length; i++) {
      for (let j = 1; j <= s1.length; j++) {
        if (s2.charAt(i - 1) === s1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1,
          );
        }
      }
    }

    return matrix[s2.length][s1.length];
  }

  /**
   * Screen for PEP (Politically Exposed Persons)
   */
  async screenForPEP(fullName: string, country: string): Promise<any> {
    try {
      this.logger.debug(`Screening ${fullName} for PEP status`);

      // In production, integrate with real PEP database
      // For now, mock implementation
      const pepPatterns = ['minister', 'president', 'senator', 'judge'];
      const isPEP = pepPatterns.some(pattern =>
        fullName.toLowerCase().includes(pattern),
      );

      return {
        isPEP,
        pepReason: isPEP ? 'Matches PEP title pattern' : null,
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error(`Error screening PEP: ${error.message}`);
      return { isPEP: false, error: error.message };
    }
  }

  /**
   * Check for duplicates/fraud patterns
   */
  async checkForDuplicates(email: string, phoneNumber?: string): Promise<any> {
    try {
      this.logger.debug(`Checking for duplicates: ${email}`);

      // In production, query database for similar emails/phone numbers
      // This is a simplified mock
      return {
        hasDuplicates: false,
        duplicateCount: 0,
        flags: [],
      };
    } catch (error) {
      this.logger.error(`Error checking duplicates: ${error.message}`);
      return { hasDuplicates: false, error: error.message };
    }
  }
}
