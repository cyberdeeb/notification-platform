import { connectRabbitMQ } from './utils/connection';
import { RouterPayload } from './types';

// This service receives events from the application, determines the appropriate notification channel (email or SMS)
export async function routeEvent(payload: RouterPayload) {
  const eventType = payload.event;
  const { channel } = await connectRabbitMQ();
  let targetQueue: string;
  // Determine the target queue based on the event type
  switch (eventType) {
    case 'sms':
      targetQueue = 'sms-notifications';
      break;
    default:
      targetQueue = 'email-notifications';
  }
  // Send the event to the appropriate queue
  await channel.assertQueue(targetQueue, { durable: true });
  channel.sendToQueue(targetQueue, Buffer.from(JSON.stringify(payload)));
  console.log(`Routed event to ${targetQueue}:`, payload);
  await channel.close();
}
