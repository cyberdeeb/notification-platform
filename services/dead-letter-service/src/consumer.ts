import { connectRabbitMQ } from './utils/connection';
import { ConsumeMessage } from 'amqplib';

// This service listens to the 'dead-letter-queue' and logs failed messages for monitoring and debugging purposes.
export const consumeDeadLetterQueue = async () => {
  // Connect to RabbitMQ
  const { channel } = await connectRabbitMQ();

  // Ensure the dead-letter queue exists
  await channel.assertQueue('dead-letter-queue', { durable: true });

  channel.consume('dead-letter-queue', async (msg: ConsumeMessage | null) => {
    if (msg) {
      const deathHeader = msg.properties?.headers?.['x-death'];
      console.error(
        'Received message in dead-letter queue:\n',
        'Death headers:',
        deathHeader,
      );
      console.error('Message content:', msg.content.toString());
      // Acknowledge the message to remove it from the queue
      channel.ack(msg);
    }
  });
};
