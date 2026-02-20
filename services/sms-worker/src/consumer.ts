import { connectRabbitMQ } from './utils/connection';
import { getUserById } from './db';
import { User } from './types';
import { sendSMS } from './utils/smsProcessor';

// This service listens to the 'sms-notifications' queue, processes incoming events,
// retrieves user information, and sends SMS accordingly.
export const consumeSMSEvents = async () => {
  // Connect to RabbitMQ
  const { channel } = await connectRabbitMQ();
  // Set up the dead-letter exchange and queue
  await channel.assertExchange('dead-letter-exchange', 'direct', {
    durable: true,
  });
  await channel.assertQueue('dead-letter-queue', { durable: true });
  // Bind the dead-letter queue to the exchange
  await channel.bindQueue(
    'dead-letter-queue',
    'dead-letter-exchange',
    'dead-letter',
  );

  // Set up the main queue with dead-lettering
  await channel.assertQueue('sms-notifications', {
    durable: true,
    arguments: {
      'x-dead-letter-exchange': 'dead-letter-exchange',
      'x-dead-letter-routing-key': 'dead-letter',
    },
  });

  channel.consume('sms-notifications', async (msg) => {
    if (msg) {
      try {
        const event = JSON.parse(msg.content.toString());
        console.log('Received SMS event:', event);
        // Retrieve user information from the database
        const user: User = await getUserById(event.userId);
        if (!user) {
          console.warn(
            `User with ID ${event.userId} not found. Sending to DLQ.`,
          );
          channel.nack(msg, false, false);
          return;
        }
        // Send SMS using the Textbelt API
        await sendSMS(
          user.phone,
          `Hi ${user.name}, you have a new ${event.event} notification from ${event.provider}.`,
        );
        channel.ack(msg);
      } catch (error) {
        console.error('Error processing SMS message:', error);
        channel.nack(msg, false, false);
      }
    }
  });
};
