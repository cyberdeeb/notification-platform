import { connectRabbitMQ } from './utils/connection';
import { RouterPayload } from './types';

export async function routeEvent(payload: RouterPayload) {
  const eventType = payload.event;
  const { channel } = await connectRabbitMQ();
  let targetQueue: string;

  switch (eventType) {
    case 'sms':
      targetQueue = 'sms-notification';
      break;
    default:
      targetQueue = 'email-notification';
  }
  await channel.assertQueue(targetQueue, { durable: true });
  channel.sendToQueue(targetQueue, Buffer.from(JSON.stringify(payload)));
  console.log(`Routed event to ${targetQueue}:`, payload);
  await channel.close();
}
