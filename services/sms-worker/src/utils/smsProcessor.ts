import twilio from 'twilio';

if (
  !process.env.TWILIO_ACCOUNT_SID ||
  !process.env.TWILIO_AUTH_TOKEN ||
  !process.env.TWILIO_PHONE_NUMBER
) {
  throw new Error('Twilio credentials are not set in environment variables');
}

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!,
);

export async function sendSMS(to: string, message: string) {
  const result = await client.messages.create({
    from: process.env.TWILIO_PHONE_NUMBER!,
    to,
    body: message,
  });

  console.log('SMS sent:', result.sid);
  return result;
}
