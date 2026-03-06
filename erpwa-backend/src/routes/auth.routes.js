import express from "express";
import {
  login,
  refresh,
  logout,
  me,
} from "../controllers/auth.controller.js";

import {
  forgotPassword,
  verifyForgotOtp,
  resetForgotPassword,
} from "../controllers/forgotPassword.controller.js";

import {
  requestChangePasswordOtp,
  verifyChangePasswordOtp,
  changePassword,
} from "../controllers/changePassword.controller.js";

import { authenticate } from "../middleware/auth.middleware.js";
import {
  validateEmail,
  validateOtp,
  validatePassword,
} from "../middleware/validation.middleware.js";
import { passwordResetLimiter } from "../middleware/rateLimit.middleware.js";

const router = express.Router();

router.post("/login", login);
router.post("/refresh", refresh);
router.post("/logout", logout);
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

/* ---------- CHANGE PASSWORD (OTP FLOW) ---------- */
/**
 * Step 1: Send OTP for Change Password
 */
router.post(
  "/change-password/request-otp",
  authenticate,
  passwordResetLimiter,
  requestChangePasswordOtp
);

/**
 * Step 2: Verify Change Password OTP → issue short lived token
 */
router.post(
  "/change-password/verify-otp",
  authenticate,
  passwordResetLimiter,
  validateOtp,
  verifyChangePasswordOtp
);

/**
 * Step 3: Submit new password using the token
 */
router.post(
  "/change-password/reset",
  passwordResetLimiter,
  validatePassword,
  changePassword
);

export default router;
