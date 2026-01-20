import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendMail({ to, subject, html, text }) {
  return resend.emails.send({
    from: "WhatsApp ERP <no-reply@indoglobaltradefair.com>",
    to,
    subject,
    html,
    text,
  });
}
