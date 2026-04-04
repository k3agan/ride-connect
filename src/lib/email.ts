import { Resend } from "resend";

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

const from = process.env.EMAIL_FROM || "RideConnect <noreply@example.com>";

interface SendEmailParams {
  to: string | string[];
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailParams) {
  const resend = getResend();

  if (!resend) {
    console.log(`[EMAIL SKIPPED - no API key] To: ${to} | Subject: ${subject}`);
    return;
  }

  try {
    await resend.emails.send({
      from,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
    });
  } catch (err) {
    console.error("Failed to send email:", err);
  }
}
