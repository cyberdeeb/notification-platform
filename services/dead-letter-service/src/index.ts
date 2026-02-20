import { consumeDeadLetterQueue } from './consumer';
import 'dotenv/config';

const startWorker = async () => {
  console.log('Starting dead letter worker...');
  await consumeDeadLetterQueue();
};

startWorker().catch((error) => {
  console.error('Error starting dead letter worker:', error);
  process.exit(1);
});
