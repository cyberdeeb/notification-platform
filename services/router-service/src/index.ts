import { consumeEvents } from './consumer';
import 'dotenv/config';

const start = async () => {
  console.log('Starting router service...');
  await consumeEvents();
};

start().catch((error) => {
  console.error('Error starting router service:', error);
  process.exit(1);
});
