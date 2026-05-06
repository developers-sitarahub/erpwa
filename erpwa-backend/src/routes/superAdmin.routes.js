import express from "express";
import {
  superAdminLogin,
  superAdminLogout,
  superAdminRefresh,
  superAdminMe,
  getVendors,
  activateVendor,
  getVendorRegistration,
  getStats,
  requestChangePasswordOtp,
  verifyChangePasswordOtp,
  resetSuperAdminPassword,
  updateSuperAdminProfile,
  getSubscriptionPlans,
  createSubscriptionPlan,
  updateSubscriptionPlan,
  deleteSubscriptionPlan,
  initSubscriptionPlans,
  updateVendorSubscription,
  updateVendorPlan,
  getPayments,
  getInvoice,
} from "../controllers/superAdmin.controller.js";
import { superAdminAuth } from "../middleware/superAdminAuth.middleware.js";

const router = express.Router();

/* ---- Public ---- */
router.post("/login", superAdminLogin);
router.post("/refresh", superAdminRefresh);
router.post("/logout", superAdminLogout);

/* ---- Protected (require access token) ---- */
router.get("/me", superAdminAuth, superAdminMe);
router.get("/vendors", superAdminAuth, getVendors);
router.get("/vendors/:id/registration", superAdminAuth, getVendorRegistration);
router.put("/vendors/:id/activate", superAdminAuth, activateVendor);
router.put("/vendors/:id/subscription", superAdminAuth, updateVendorSubscription);
router.put("/vendors/:id/plan", superAdminAuth, updateVendorPlan);
router.get("/stats", superAdminAuth, getStats);
router.get("/payments", superAdminAuth, getPayments);
router.get("/invoice/:paymentId", superAdminAuth, getInvoice);

/* ---- Profile ---- */
router.put("/profile", superAdminAuth, updateSuperAdminProfile);

/* ---- Subscription Plans ---- */
router.get("/subscription-plans", superAdminAuth, getSubscriptionPlans);
router.post("/subscription-plans", superAdminAuth, createSubscriptionPlan);
router.post("/subscription-plans/init", superAdminAuth, initSubscriptionPlans);
router.put("/subscription-plans/:id", superAdminAuth, updateSubscriptionPlan);
router.delete("/subscription-plans/:id", superAdminAuth, deleteSubscriptionPlan);

/* ---- Change Password (OTP flow) ---- */
router.post(
  "/change-password/request-otp",
  superAdminAuth,
  requestChangePasswordOtp,
); // needs saToken to know who to send OTP to
router.post("/change-password/verify-otp", verifyChangePasswordOtp); // auth via signed otpToken in body
router.post("/change-password/reset", resetSuperAdminPassword); // auth via Bearer resetToken header

export default router;
