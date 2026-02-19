import { connectRabbitMQ } from './utils/connection';
import { getUserById } from './db';
import { User } from './types';
import { sendSMS } from './utils/smsProcessor';

// This service listens to the 'sms-notifications' queue, processes incoming events,
// retrieves user information, and sends SMS accordingly.
export const consumeSMSEvents = async () => {
  // Connect to RabbitMQ
  const { channel } = await connectRabbitMQ();
  await channel.assertQueue('sms-notifications', { durable: true });
  channel.consume('sms-notifications', async (msg) => {
    if (msg) {
      try {
        const event = JSON.parse(msg.content.toString());
        console.log('Received SMS event:', event);
        // Retrieve user information from the database
        const user: User = await getUserById(event.userId);
        if (!user) {
          console.warn(`User with ID ${event.userId} not found. Skipping SMS.`);
          channel.ack(msg);
          return;
        }
        // Send SMS using the Twilio API
        await sendSMS(
          user.phone,
          `Notification: ${event.event}: ${JSON.stringify(event.data)}`,
        );
        channel.ack(msg);
      } catch (error) {
        console.error('Error processing SMS message:', error);
        channel.nack(msg, false, false);
      }
    }
  });
};
