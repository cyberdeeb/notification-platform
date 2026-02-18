import { connectRabbitMQ } from './utils/connection';

export async function publishEvent(payload: object) {
  const { channel } = await connectRabbitMQ();
  await channel.assertQueue('raw-events', { durable: true });
  channel.sendToQueue('raw-events', Buffer.from(JSON.stringify(payload)));
  await channel.close();
}
