import { consumeSMSEvents } from './consumer';
import 'dotenv/config';

const startWorker = async () => {
  console.log('Starting SMS worker...');
  await consumeSMSEvents();
};

startWorker().catch((error) => {
  console.error('Error starting SMS worker:', error);
  process.exit(1);
});
