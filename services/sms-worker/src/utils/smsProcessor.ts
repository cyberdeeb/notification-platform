import axios from 'axios';

if (!process.env.TEXTBELT_API_KEY) {
  throw new Error('TEXTBELT_API_KEY is not set in environment variables');
}

export async function sendSMS(to: string, message: string) {
  const response = await axios.post('https://textbelt.com/text', {
    phone: to,
    message,
    key: process.env.TEXTBELT_API_KEY,
  });

  if (!response.data.success) {
    throw new Error(`SMS failed: ${response.data.error}`);
  }

  console.log('SMS sent, textId:', response.data.textId);
  return response.data;
}
