import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import pool from "../db/index.js";

import { hashToken } from "../utils/hash.js";
import { generateOtp, hashOtp } from "../utils/otp.js";
import { sendMail } from "../utils/mailer.js";

import { passwordResetOtpTemplate } from "../emails/passwordResetOtp.template.js";

export async function forgotPassword(req, res) {
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
      AND password_hash IS NOT NULL
    `,
    [email]
  );

  // ❌ user does not exist
  if (!rows.length) {
    return res.status(404).json({
      message: "No account exists with this email",
    });
  }

  const user = rows[0];
  const otp = generateOtp();

  // invalidate previous OTPs
  await pool.query(
    "UPDATE password_reset_otps SET used = true WHERE user_id = $1",
    [user.id]
  );

  await pool.query(
    `
    INSERT INTO password_reset_otps (user_id, otp_hash, expires_at)
    VALUES ($1, $2, NOW() + INTERVAL '10 minutes')
    `,
    [user.id, hashOtp(otp)]
  );

  await sendMail({
    to: email,
    ...passwordResetOtpTemplate({
      name: user.name,
      otp,
    }),
  });

  res.json({ message: "OTP sent to your email" });
}

export async function verifyForgotOtp(req, res) {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ message: "Email and OTP are required" });
  }

  const { rows } = await pool.query(
    `
    SELECT o.id, u.id AS user_id
    FROM users u
    JOIN password_reset_otps o ON o.user_id = u.id
    WHERE u.email = $1
      AND o.otp_hash = $2
      AND o.used = false
      AND o.expires_at > NOW()
    `,
    [email, hashOtp(otp)]
  );

  if (!rows.length) {
    return res.status(400).json({ message: "Invalid or expired OTP" });
  }

  // Mark OTP as used
  await pool.query("UPDATE password_reset_otps SET used = true WHERE id = $1", [
    rows[0].id,
  ]);

  // ✅ ISSUE RESET TOKEN (10 min)
  const resetToken = jwt.sign(
    { sub: rows[0].user_id, type: "password_reset" },
    process.env.PASSWORD_RESET_TOKEN_SECRET,
    { expiresIn: "10m" }
  );

  res.json({ resetToken });
}

export async function resetForgotPassword(req, res) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ message: "Missing reset token" });
  }

  const token = authHeader.split(" ")[1];

  let payload;
  try {
    payload = jwt.verify(token, process.env.PASSWORD_RESET_TOKEN_SECRET);
  } catch {
    return res.status(401).json({ message: "Invalid or expired reset token" });
  }

  if (payload.type !== "password_reset") {
    return res.status(401).json({ message: "Invalid token type" });
  }

  const { newPassword } = req.body;
  if (!newPassword || newPassword.length < 8) {
    return res.status(400).json({
      message: "Password must be at least 8 characters",
    });
  }

  await pool.query("UPDATE users SET password_hash = $1 WHERE id = $2", [
    await bcrypt.hash(newPassword, 10),
    payload.sub,
  ]);

  res.json({ message: "Password reset successful" });
}
