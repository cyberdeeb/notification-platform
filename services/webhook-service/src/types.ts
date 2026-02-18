export interface WebhookPayload {
  provider: string;
  event: string;
  userId: string;
  data: Record<string, unknown>;
  timestamp: string;
}
