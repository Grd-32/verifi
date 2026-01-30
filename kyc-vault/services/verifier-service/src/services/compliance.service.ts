import { Injectable } from "@nestjs/common";
import axios from "axios";

@Injectable()
export class ComplianceService {
  async checkAML(
    name: string,
    country: string
  ): Promise<{ riskScore: number; status: "CLEAR" | "REVIEW" | "BLOCK" }> {
    try {
      // Mock AML check - replace with actual API call to ComplyAdvantage or similar
      // This is a stub for demonstration
      const riskScore = Math.random() * 100;

      let status: "CLEAR" | "REVIEW" | "BLOCK";
      if (riskScore < 20) {
        status = "CLEAR";
      } else if (riskScore < 70) {
        status = "REVIEW";
      } else {
        status = "BLOCK";
      }

      return { riskScore, status };
    } catch (error) {
      console.error("AML check failed:", error);
      return { riskScore: 0, status: "CLEAR" };
    }
  }

  async checkSanctionsList(country: string): Promise<boolean> {
    // Mock sanction check
    const sanctionedCountries = [
      "KP",
      "IR",
      "SY",
      "CU",
    ]; /* Example sanctioned countries */
    return sanctionedCountries.includes(country);
  }

  async verifyCredentialRevocation(credentialId: string): Promise<boolean> {
    try {
      const response = await axios.get(
        `${process.env.REVOCATION_SERVICE_URL}/api/revocation/${credentialId}`
      );
      return !response.data.revoked;
    } catch (error) {
      console.error("Revocation check failed:", error);
      return false;
    }
  }
}
