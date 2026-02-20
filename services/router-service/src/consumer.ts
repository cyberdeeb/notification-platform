import { connectRabbitMQ } from './utils/connection';
import { routeEvent } from './router';

// This service listens to the 'raw-events' queue, processes incoming events,
// and routes them to the appropriate notification channels (email or SMS) based on the event type.
export const consumeEvents = async () => {
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

  // Consume messages from the 'raw-events' queue
  channel.consume('raw-events', async (msg) => {
    if (msg) {
      try {
        const event = JSON.parse(msg.content.toString());
        console.log('Received event:', event);
        // Route the event to the appropriate queue based on its type
        const targetQueue = await routeEvent(event);
        await channel.assertQueue(targetQueue, {
          durable: true,
          arguments: {
            'x-dead-letter-exchange': 'dead-letter-exchange',
            'x-dead-letter-routing-key': 'dead-letter',
          },
        });
        channel.sendToQueue(targetQueue, Buffer.from(JSON.stringify(event)));
        channel.ack(msg);
      } catch (error) {
        console.error('Error processing message. Sending to DLQ:', error);
        channel.nack(msg, false, false);
      }
    }
  });
};
