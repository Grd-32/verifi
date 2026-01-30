export class CreateWebhookDto {
  url?: string;
  webhookUrl?: string;
  walletDid?: string;
  events?: string[];
  active?: boolean;
}
