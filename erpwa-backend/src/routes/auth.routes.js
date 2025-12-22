import express from "express";
import {
  login,
  refresh,
  logout,
  me,
  forgotPassword,
  verifyForgotOtp,
  resetForgotPassword,
} from "../controllers/auth.controller.js";

import { authenticate } from "../middleware/auth.middleware.js";
import {
  validateEmail,
  validateOtp,
  validatePassword,
} from "../middleware/validation.middleware.js";
import { passwordResetLimiter } from "../middleware/rateLimit.middleware.js";

const router = express.Router();

/* ---------- AUTH ---------- */
router.post("/login", login);
router.post("/refresh", refresh);
router.post("/logout", authenticate, logout);
router.get("/me", authenticate, me);

/* ---------- PASSWORD RESET (OTP FLOW) ---------- */

/**
 * Step 1: Send OTP
 */
router.post(
  "/forgot-password",
  passwordResetLimiter,
  validateEmail,
  forgotPassword
);

/**
 * Step 2: Verify OTP → issue resetToken
 */
router.post(
  "/verify-forgot-otp",
  passwordResetLimiter,
  validateEmail,
  validateOtp,
  verifyForgotOtp
);

/**
 * Step 3: Reset password using resetToken
 */
router.post(
  "/reset-forgot-password",
  passwordResetLimiter,
  validatePassword,
  resetForgotPassword
);

export default router;
