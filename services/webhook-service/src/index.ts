import express, { Request, Response } from 'express';
import { publishEvent } from './publisher';
import { WebhookPayload } from './types';
import 'dotenv/config';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON
app.use(express.json());

// Webhook endpoint to receive events
app.post('/webhook', async (req: Request, res: Response) => {
  try {
    const body = req.body;
    if (!body) {
      res.status(400).send('Request body is required');
      return;
    }

    if (!body.provider || !body.event || !body.userId) {
      res.status(400).send('Missing required fields: provider, event, userId');
      return;
    }

    const payload: WebhookPayload = {
      provider: body.provider,
      event: body.event,
      userId: body.userId,
      data: body.data || {},
      timestamp: new Date().toISOString(),
    };

    console.log('Received webhook event:', payload);
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
