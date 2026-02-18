import amqp from 'amqplib';

// Establish a connection to RabbitMQ and create a channel
export const connectRabbitMQ = async () => {
  try {
    const connection = await amqp.connect(
      process.env.RABBITMQ_URL || 'amqp://localhost',
    );
    const channel = await connection.createChannel();
    console.log('Connected to RabbitMQ');
    return { connection, channel };
  } catch (error) {
    console.error('Error connecting to RabbitMQ:', error);
    throw error;
  }
};

// Get the initialized channel
export const getRabbitMQChannel = async () => {
  const { channel } = await connectRabbitMQ();
  if (!channel) {
    throw new Error(
      'RabbitMQ channel not initialized. Call connectRabbitMQ first.',
    );
  }
  return channel;
};

// Close the RabbitMQ connection
export const closeRabbitMQConnection = async (connection: any) => {
  try {
    await connection.close();
    console.log('RabbitMQ connection closed');
  } catch (error) {
    console.error('Error closing RabbitMQ connection:', error);
    throw error;
  }
};
