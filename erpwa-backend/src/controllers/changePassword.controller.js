import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import prisma from "../prisma.js";

import { generateOtp, hashOtp } from "../utils/otp.js";
import { sendMail } from "../utils/mailer.js";
import { passwordResetOtpTemplate } from "../emails/passwordResetOtp.template.js";

/**
 * 1. REQUEST OTP FOR CHANGE PASSWORD
 */
export async function requestChangePasswordOtp(req, res) {
    try {
        // Expected that this route is protected by `authenticate`, so `req.user` exists.
        // If not, we can also use email from req.body.
        const userEmail = req.user?.email || req.body.email;

        if (!userEmail) {
            return res.status(400).json({ message: "Email is required" });
        }

        const user = await prisma.user.findFirst({
            where: {
                email: userEmail,
                role: {
                    in: ["vendor_owner", "vendor_admin", "sales", "owner"],
                },
            },
            select: {
                id: true,
                name: true,
            },
        });

        if (!user) {
            return res.status(404).json({
                message: "User not found",
            });
        }

        const otp = generateOtp();

        // Invalidate previous OTPs
        await prisma.passwordResetOtp.updateMany({
            where: {
                userId: user.id,
                used: false,
            },
            data: {
                used: true,
            },
        });

        // Create new OTP (valid for 5 minutes as requested)
        await prisma.passwordResetOtp.create({
            data: {
                userId: user.id,
                otpHash: hashOtp(otp),
                expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
            },
        });

        await sendMail({
            to: userEmail,
            ...passwordResetOtpTemplate({
                name: user.name,
                otp,
            }),
        });

        console.log("✅ Change Password OTP email sent to", userEmail);
        return res.json({ message: "OTP sent to your email" });
    } catch (err) {
        console.error("❌ CHANGE PASSWORD OTP ERROR:", err);
        res
            .status(500)
            .json({ message: err.message || "Failed to process request" });
    }
}

/**
 * 2. VERIFY OTP FOR CHANGE PASSWORD
 */
export async function verifyChangePasswordOtp(req, res) {
    try {
        const userEmail = req.user?.email || req.body.email;
        const { otp } = req.body;

        if (!userEmail || !otp) {
            return res.status(400).json({
                message: "Email and OTP are required",
            });
        }

        const otpRecord = await prisma.passwordResetOtp.findFirst({
            where: {
                otpHash: hashOtp(otp),
                used: false,
                expiresAt: {
                    gt: new Date(),
                },
                user: {
                    email: userEmail,
                },
            },
            select: {
                id: true,
                userId: true,
            },
        });

        if (!otpRecord) {
            return res.status(400).json({
                message: "Invalid or expired OTP",
            });
        }

        // Mark OTP as used
        await prisma.passwordResetOtp.update({
            where: { id: otpRecord.id },
            data: { used: true },
        });

        // Issue reset token valid for EXACTLY 5 minutes as requested
        const resetToken = jwt.sign(
            {
                sub: otpRecord.userId,
                type: "change_password",
            },
            process.env.PASSWORD_RESET_TOKEN_SECRET,
            { expiresIn: "5m" }, // 5 minutes exact
        );

        res.json({ resetToken, expires_in: 300 }); // tell frontend 300 seconds
    } catch (err) {
        console.error("❌ VERIFY CHANGE PASSWORD OTP ERROR:", err);
        res.status(500).json({ message: err.message || "Failed to verify OTP" });
    }
}

/**
 * 3. SET NEW PASSWORD
 */
export async function changePassword(req, res) {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({
                message: "Missing reset token",
            });
        }

        const token = authHeader.split(" ")[1];

        let payload;
        try {
            payload = jwt.verify(token, process.env.PASSWORD_RESET_TOKEN_SECRET);
        } catch (err) {
            return res.status(401).json({
                message: "Invalid or expired reset token. Time may have run out.",
            });
        }

        if (payload.type !== "change_password") {
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

        const user = await prisma.user.findUnique({
            where: { id: payload.sub },
        });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Update password
        const passwordHash = await bcrypt.hash(newPassword, 10);

        await prisma.user.update({
            where: { id: payload.sub },
            data: { passwordHash },
        });

        // Invalidate all refresh tokens for this user (force re-login everywhere)
        await prisma.refreshToken.deleteMany({
            where: { userId: payload.sub },
        });

        res.json({
            message: "Password changed successfully",
            requiresRelogin: true, // Signal to frontend to logout
        });
    } catch (err) {
        console.error("❌ CHANGE PASSWORD ERROR:", err);
        res
            .status(500)
            .json({ message: err.message || "Failed to change password" });
    }
}
