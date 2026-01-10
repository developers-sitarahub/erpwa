import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import prisma from "../prisma.js";

import { generateOtp, hashOtp } from "../utils/otp.js";
import { sendMail } from "../utils/mailer.js";
import { passwordResetOtpTemplate } from "../emails/passwordResetOtp.template.js";

/* ======================================================
   SEND OTP
====================================================== */
export async function forgotPassword(req, res) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await prisma.user.findFirst({
      where: {
        email,
        role: { in: ["vendor_owner", "vendor_admin", "sales"] },
      },
      select: {
        id: true,
        name: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        message: "No account exists with this email",
      });
    }

    const otp = generateOtp();
    const otpHash = hashOtp(otp);

    await prisma.$transaction([
      prisma.passwordResetOtp.updateMany({
        where: { userId: user.id },
        data: { used: true },
      }),
      prisma.passwordResetOtp.create({
        data: {
          userId: user.id,
          otpHash,
          expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        },
      }),
    ]);

    await sendMail({
      to: email,
      ...passwordResetOtpTemplate({
        name: user.name,
        otp,
      }),
    });

    return res.json({ message: "OTP sent to your email" });
  } catch (err) {
    console.error("Forgot password error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}

/* ======================================================
   VERIFY OTP
====================================================== */
export async function verifyForgotOtp(req, res) {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        message: "Email and OTP are required",
      });
    }

    const record = await prisma.passwordResetOtp.findFirst({
      where: {
        used: false,
        expiresAt: { gt: new Date() },
        otpHash: hashOtp(otp),
        user: { email },
      },
      select: {
        id: true,
        userId: true,
      },
    });

    if (!record) {
      return res.status(400).json({
        message: "Invalid or expired OTP",
      });
    }

    await prisma.passwordResetOtp.update({
      where: { id: record.id },
      data: { used: true },
    });

    const resetToken = jwt.sign(
      { sub: record.userId, type: "password_reset" },
      process.env.PASSWORD_RESET_TOKEN_SECRET,
      { expiresIn: "10m" }
    );

    return res.json({ resetToken });
  } catch (err) {
    console.error("Verify OTP error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}

/* ======================================================
   RESET PASSWORD
====================================================== */
export async function resetForgotPassword(req, res) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ message: "Missing reset token" });
    }

    const token = authHeader.split(" ")[1];

    let payload;
    try {
      payload = jwt.verify(token, process.env.PASSWORD_RESET_TOKEN_SECRET);
    } catch {
      return res.status(401).json({
        message: "Invalid or expired reset token",
      });
    }

    if (payload.type !== "password_reset") {
      return res.status(401).json({
        message: "Invalid token type",
      });
    }

    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({
        message: "Password must be at least 8 characters",
      });
    }

    await prisma.user.update({
      where: { id: payload.sub },
      data: {
        passwordHash: await bcrypt.hash(newPassword, 10),
      },
    });

    await prisma.passwordResetOtp.updateMany({
      where: { userId: payload.sub },
      data: { used: true },
    });

    return res.json({
      message: "Password reset successful",
    });
  } catch (err) {
    console.error("Reset password error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}
