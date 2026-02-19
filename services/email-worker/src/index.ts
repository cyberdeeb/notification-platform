import { consumeEmailEvents } from './consumer';
import 'dotenv/config';

const startWorker = async () => {
  console.log('Starting email worker...');
  await consumeEmailEvents();
};

startWorker().catch((error) => {
  console.error('Error starting email worker:', error);
  process.exit(1);
});
