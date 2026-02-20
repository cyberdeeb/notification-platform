import { connectRabbitMQ } from './utils/connection';
import { WebhookPayload } from './types';

export async function publishEvent(payload: WebhookPayload) {
  const { channel } = await connectRabbitMQ();
  // Set up the dead-letter exchange and queue
  await channel.assertExchange('dead-letter-exchange', 'direct', {
    durable: true,
  });
  // Ensure the dead-letter queue exists
  await channel.assertQueue('dead-letter-queue', { durable: true });
  // Bind the dead-letter queue to the exchange
  await channel.bindQueue(
    'dead-letter-queue',
    'dead-letter-exchange',
    'dead-letter',
  );

  // Set up the main queue with dead-lettering
  await channel.assertQueue('raw-events', {
    durable: true,
    arguments: {
      'x-dead-letter-exchange': 'dead-letter-exchange',
      'x-dead-letter-routing-key': 'dead-letter',
    },
  });

  channel.sendToQueue('raw-events', Buffer.from(JSON.stringify(payload)));
  await channel.close();
}
