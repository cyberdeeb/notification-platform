import { consumeEvents } from './consumer';

const start = async () => {
  await consumeEvents();
};

start();
