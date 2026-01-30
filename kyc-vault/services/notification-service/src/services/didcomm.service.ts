import { Injectable } from "@nestjs/common";

@Injectable()
export class DIDCommService {
  async encryptMessage(
    recipientDid: string,
    message: Record<string, unknown>
  ): Promise<string> {
    // DIDComm v2 encryption would happen here
    // For now, return JSON stringified message
    return JSON.stringify({
      protected: Buffer.from(JSON.stringify({ typ: "application/didcomm-plain+json" })).toString("base64"),
      recipients: [{ header: { kid: recipientDid }, encrypted_key: "" }],
      iv: "",
      ciphertext: Buffer.from(JSON.stringify(message)).toString("base64"),
      tag: "",
    });
  }

  async decryptMessage(encryptedMessage: string): Promise<Record<string, unknown>> {
    // DIDComm v2 decryption would happen here
    try {
      const msg = JSON.parse(encryptedMessage);
      return JSON.parse(Buffer.from(msg.ciphertext, "base64").toString());
    } catch {
      return {};
    }
  }
}
