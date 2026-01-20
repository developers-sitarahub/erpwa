import prisma from "../../prisma.js";
import jwt from "jsonwebtoken";
import { hashPassword } from "../../utils/password.js";
import { generateOtp, hashOtp } from "../../utils/otp.js";
import { sendMail } from "../../utils/mailer.js";

import { passwordResetOtpTemplate } from "../../emails/passwordResetOtp.template.js";
export async function sendResetOtp(email) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return;

  await prisma.passwordResetOtp.updateMany({
    where: { userId: user.id, used: false },
    data: { used: true },
  });

  const otp = generateOtp();

  await prisma.passwordResetOtp.create({
    data: {
      userId: user.id,
      otpHash: hashOtp(otp),
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    },
  });

  // ✅ USE TEMPLATE HERE
  await sendMail({
    to: email,
    ...passwordResetOtpTemplate({
      name: user.name,
      otp,
    }),
  });
}

export async function verifyForgotOtp(email, otp) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error("Invalid request");

  const record = await prisma.passwordResetOtp.findFirst({
    where: {
      userId: user.id,
      otpHash: hashOtp(otp),
      used: false,
      expiresAt: { gt: new Date() },
    },
  });

  if (!record) throw new Error("Invalid or expired OTP");

  // Mark OTP as used
  await prisma.passwordResetOtp.update({
    where: { id: record.id },
    data: { used: true },
  });

  // Issue short-lived reset token
  return jwt.sign(
    { sub: user.id, type: "password_reset" },
    process.env.PASSWORD_RESET_TOKEN_SECRET,
    { expiresIn: "10m" }
  );
}

export async function resetForgotPassword(resetToken, newPassword) {
  if (!newPassword || newPassword.length < 8) {
    throw new Error("Password must be at least 8 characters");
  }

  const payload = jwt.verify(
    resetToken,
    process.env.PASSWORD_RESET_TOKEN_SECRET
  );

  if (payload.type !== "password_reset") {
    throw new Error("Invalid reset token");
  }

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: payload.sub },
      data: { passwordHash: await hashPassword(newPassword) },
    });

    // Invalidate all refresh tokens (force re-login)
    await tx.refreshToken.deleteMany({
      where: { userId: payload.sub },
    });
  });
}
