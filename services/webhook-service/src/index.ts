import express, { Request, Response } from 'express';
import { publishEvent } from './publisher';
import 'dotenv/config';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON
app.use(express.json());

// Webhook endpoint to receive events
app.post('/webhook', async (req: Request, res: Response) => {
  try {
    const payload = req.body;
    console.log('Received webhook event:', payload);
    if (!payload) {
      return res.status(400).send('Payload is required');
    }
    await publishEvent(payload);
    res.status(200).send('Event published successfully');
  } catch (error) {
    console.error('Error publishing event:', error);
    res.status(500).send('Failed to publish event');
  }
});

app.listen(PORT, () => {
  console.log(`Webhook service is running on port ${PORT}`);
});
