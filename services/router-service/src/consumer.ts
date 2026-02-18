import { connectRabbitMQ } from './utils/connection';
import { routeEvent } from './router';

export const consumeEvents = async () => {
  const { channel } = await connectRabbitMQ();
  await channel.assertQueue('raw-events', { durable: true });
  channel.consume('raw-events', async (msg) => {
    if (msg) {
      try {
        const event = JSON.parse(msg.content.toString());
        console.log('Received event:', event);
        await routeEvent(event);
        channel.ack(msg);
      } catch (error) {
        console.error('Error processing message:', error);
        channel.nack(msg, false, false);
      }
    }
  });
};
