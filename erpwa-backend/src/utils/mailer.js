import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false, // true only for port 465
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS, // 🔥 REQUIRED
  },
});

export async function sendMail({ to, subject, text, html }) {
  await transporter.sendMail({
    from: `"WhatsApp ERP" <${process.env.SMTP_FROM}>`,
    to,
    subject,
    text,
    html,
  });
}
