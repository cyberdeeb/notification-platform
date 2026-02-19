import { connectRabbitMQ } from './utils/connection';
import { getUserById } from './db';
import { User } from './types';
import { sendEmail } from './utils/emailProcessor';

// This service listens to the 'email-notifications' queue, processes incoming events,
// retrieves user information, and sends emails accordingly.
export const consumeEmailEvents = async () => {
  // Connect to RabbitMQ
  const { channel } = await connectRabbitMQ();
  await channel.assertQueue('email-notifications', { durable: true });
  channel.consume('email-notifications', async (msg) => {
    if (msg) {
      try {
        const event = JSON.parse(msg.content.toString());
        console.log('Received email event:', event);
        // Retrieve user information from the database
        const user: User = await getUserById(event.userId);
        if (!user) {
          console.warn(
            `User with ID ${event.userId} not found. Skipping email.`,
          );
          channel.ack(msg);
          return;
        }
        // Send email using the Resend API
        await sendEmail(
          user.email,
          `Notification: ${event.event}`,
          `<p> Hello, ${user.name}, You have a new notification: ${JSON.stringify(event.data)}</p>`,
        );
        channel.ack(msg);
      } catch (error) {
        console.error('Error processing email message:', error);
        channel.nack(msg, false, false);
      }
    }
  });
};
