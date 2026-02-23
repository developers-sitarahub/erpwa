import express from "express";
import {
  requestOtp,
  verifyStep1,
  submitStep2,
  submitStep3,
  getOnboardingStatus,
} from "../controllers/onboarding.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = express.Router();

// Step 1: Send OTP and then verify
router.post("/request-otp", requestOtp);
router.post("/step1", verifyStep1);

// Step 2 & 3: Require authentication (user must be logged in from step 1)
router.post("/step2", authenticate, submitStep2);
router.post("/step3", authenticate, submitStep3);

// Get current status
router.get("/status", authenticate, getOnboardingStatus);

export default router;
