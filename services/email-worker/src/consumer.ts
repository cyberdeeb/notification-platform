import { connectRabbitMQ } from './utils/connection';
import { getUserById } from './db';
import { User } from './types';
import { sendEmail } from './utils/emailProcessor';

// This service listens to the 'email-notifications' queue, processes incoming events,
// retrieves user information, and sends emails accordingly.
export const consumeEmailEvents = async () => {
  // Connect to RabbitMQ
  const { channel } = await connectRabbitMQ();
  // Set up the dead-letter exchange and queue
  await channel.assertExchange('dead-letter-exchange', 'direct', {
    durable: true,
  });
  await channel.assertQueue('dead-letter-queue', { durable: true });
  await channel.bindQueue(
    'dead-letter-queue',
    'dead-letter-exchange',
    'dead-letter',
  );
  // Set up the main queue with dead-lettering
  await channel.assertQueue('email-notifications', {
    durable: true,
    arguments: {
      'x-dead-letter-exchange': 'dead-letter-exchange',
      'x-dead-letter-routing-key': 'dead-letter',
    },
  });

  channel.consume('email-notifications', async (msg) => {
    if (msg) {
      try {
        const event = JSON.parse(msg.content.toString());
        console.log('Received email event:', event);
        // Retrieve user information from the database
        const user: User = await getUserById(event.userId);
        if (!user) {
          console.warn(
            `User with ID ${event.userId} not found. Sending to DLQ.`,
          );
          channel.nack(msg, false, false);
          return;
        }
        // Send email using the Resend API
        await sendEmail(
          user.email,
          `Notification: ${event.event}`,
          `<h2>Hello ${user.name},</h2>
   <p>You have a new <strong>${event.event}</strong> notification from <strong>${event.provider}</strong>.</p>
   <p>Details: ${JSON.stringify(event.data, null, 2)}</p>
   <p>Received at: ${event.timestamp}</p>`,
        );
        channel.ack(msg);
      } catch (error) {
        console.error('Error processing email message:', error);
        channel.nack(msg, false, false);
      }
    }
  });
};
