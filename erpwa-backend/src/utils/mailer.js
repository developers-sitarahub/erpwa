import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendMail({ to, subject, html, text }) {
  const result = await resend.emails.send({
    from: "WhatsApp ERP <no-reply@indoglobaltradefair.com>",
    to,
    subject,
    html,
    text,
  });

  if (result?.error) {
    console.error(`❌ [Resend] Failed to send email to ${to}:`, JSON.stringify(result.error));
  } else {
    console.log(`📧 [Resend] Email queued → to: ${to} | subject: "${subject}" | id: ${result?.data?.id}`);
  }

  return result;
}
