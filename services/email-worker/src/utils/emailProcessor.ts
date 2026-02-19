import { Resend } from 'resend';

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
