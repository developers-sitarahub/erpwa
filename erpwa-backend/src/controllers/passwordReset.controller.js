import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import pool from "../db/index.js";

import { hashToken } from "../utils/hash.js";
import { generateOtp, hashOtp } from "../utils/otp.js";
import { sendMail } from "../utils/mailer.js";

import { passwordResetLinkTemplate } from "../emails/passwordResetLink.template.js";
import { passwordResetOtpTemplate } from "../emails/passwordResetOtp.template.js";

/* ================= REQUEST RESET LINK ================= */

export async function requestPasswordReset(req, res) {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  const { rows } = await pool.query(
    `
    SELECT id, name
    FROM users
    WHERE email = $1
      AND role IN ('vendor_owner', 'vendor_admin', 'sales')
    `,
    [email]
  );

  // ❌ USER DOES NOT EXIST → STOP
  if (!rows.length) {
    return res.status(404).json({
      message: "No account exists with this email",
    });
  }

  const { id: userId, name } = rows[0];

  // invalidate old links
  await pool.query(
    "UPDATE password_reset_links SET used = true WHERE user_id = $1 AND used = false",
    [userId]
  );

  const token = jwt.sign(
    { userId, purpose: "password-reset" },
    process.env.PASSWORD_RESET_TOKEN_SECRET,
    { expiresIn: "1h" }
  );

  await pool.query(
    `
    INSERT INTO password_reset_links (user_id, token_hash, expires_at)
    VALUES ($1, $2, NOW() + INTERVAL '1 hour')
    `,
    [userId, hashToken(token)]
  );

  const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

  const emailData = passwordResetLinkTemplate({
    name,
    resetLink,
  });

  await sendMail({
    to: email,
    ...emailData,
  });

  return res.json({ message: "Reset link sent" });
}

/* ================= VALIDATE LINK ================= */

export async function validateResetLink(req, res) {
  const { token } = req.body;

  let payload;
  try {
    payload = jwt.verify(token, process.env.PASSWORD_RESET_TOKEN_SECRET);
  } catch {
    return res.status(401).json({ message: "Invalid or expired link" });
  }

  const { rows } = await pool.query(
    `
    SELECT id FROM password_reset_links
    WHERE user_id = $1
      AND token_hash = $2
      AND used = false
      AND expires_at > NOW()
    `,
    [payload.userId, hashToken(token)]
  );

  if (!rows.length) {
    return res.status(401).json({ message: "Link expired or already used" });
  }

  res.json({ valid: true });
}

/* ================= SEND OTP ================= */

export async function sendResetOtp(req, res) {
  const { token, email } = req.body;

  let payload;
  try {
    payload = jwt.verify(token, process.env.PASSWORD_RESET_TOKEN_SECRET);
  } catch {
    return res.status(401).json({ message: "Invalid or expired link" });
  }

  const { rows } = await pool.query(
    "SELECT id, name FROM users WHERE id = $1 AND email = $2",
    [payload.userId, email]
  );

  if (!rows.length) {
    return res.status(400).json({ message: "Invalid email" });
  }

  const otp = generateOtp();

  await pool.query(
    `
    INSERT INTO password_reset_otps (user_id, otp_hash, expires_at)
    VALUES ($1, $2, NOW() + INTERVAL '10 minutes')
    `,
    [payload.userId, hashOtp(otp)]
  );

  const emailData = passwordResetOtpTemplate({
    name: rows[0].name,
    otp,
  });

  await sendMail({
    to: email,
    ...emailData,
  });

  res.json({ message: "OTP sent" });
}

/* ================= VERIFY OTP ================= */

export async function verifyResetOtp(req, res) {
  const { token, otp } = req.body;

  let payload;
  try {
    payload = jwt.verify(token, process.env.PASSWORD_RESET_TOKEN_SECRET);
  } catch {
    return res.status(401).json({ message: "Invalid or expired link" });
  }

  const { rows } = await pool.query(
    `
    SELECT id FROM password_reset_otps
    WHERE user_id = $1
      AND otp_hash = $2
      AND used = false
      AND expires_at > NOW()
    `,
    [payload.userId, hashOtp(otp)]
  );

  if (!rows.length) {
    return res.status(400).json({ message: "Invalid or expired OTP" });
  }

  await pool.query("UPDATE password_reset_otps SET used = true WHERE id = $1", [
    rows[0].id,
  ]);

  res.json({ message: "OTP verified" });
}

/* ================= RESET PASSWORD ================= */

export async function resetPassword(req, res) {
  const { token, newPassword } = req.body;

  let payload;
  try {
    payload = jwt.verify(token, process.env.PASSWORD_RESET_TOKEN_SECRET);
  } catch {
    return res.status(401).json({ message: "Invalid or expired link" });
  }

  const { rows } = await pool.query(
    `
    SELECT id FROM password_reset_links
    WHERE user_id = $1
      AND token_hash = $2
      AND used = false
      AND expires_at > NOW()
    `,
    [payload.userId, hashToken(token)]
  );

  if (!rows.length) {
    return res.status(401).json({ message: "Link expired or used" });
  }

  await pool.query("UPDATE users SET password_hash = $1 WHERE id = $2", [
    await bcrypt.hash(newPassword, 10),
    payload.userId,
  ]);

  // Permanently invalidate link
  await pool.query(
    "UPDATE password_reset_links SET used = true, used_at = NOW() WHERE id = $1",
    [rows[0].id]
  );

  res.json({ message: "Password reset successful" });
}
