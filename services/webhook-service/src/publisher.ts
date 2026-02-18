import { connectRabbitMQ } from './utils/connection';
import { WebhookPayload } from './types';

export async function publishEvent(payload: WebhookPayload) {
  const { channel } = await connectRabbitMQ();
  await channel.assertQueue('raw-events', { durable: true });
  channel.sendToQueue('raw-events', Buffer.from(JSON.stringify(payload)));
  await channel.close();
}
