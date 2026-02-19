import { Resend } from 'resend';

if (!process.env.RESEND_API_KEY || !process.env.FROM_EMAIL) {
  throw new Error(
    'Resend API key or FROM_EMAIL is not set in environment variables',
  );
}

const resend = new Resend(process.env.RESEND_API_KEY!);
// Function to send email using the Resend API
export const sendEmail = async (to: string, subject: string, html: string) => {
  await resend.emails.send({
    from: process.env.FROM_EMAIL!,
    to: [to],
    subject,
    html,
  });
};
