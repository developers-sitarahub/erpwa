import express from 'express';
import {
  superAdminLogin,
  superAdminLogout,
  superAdminMe,
  getVendors,
  activateVendor,
  getVendorRegistration,
  getStats,
  requestChangePasswordOtp,
  verifyChangePasswordOtp,
  resetSuperAdminPassword,
  updateSuperAdminProfile,
} from '../controllers/superAdmin.controller.js';
import { superAdminAuth } from '../middleware/superAdminAuth.middleware.js';

const router = express.Router();

/* ---- Public ---- */
router.post('/login', superAdminLogin);
router.post('/logout', superAdminLogout);

/* ---- Protected (require saToken cookie) ---- */
router.get('/me',      superAdminAuth, superAdminMe);
router.get('/vendors',                       superAdminAuth, getVendors);
router.get('/vendors/:id/registration',      superAdminAuth, getVendorRegistration);
router.put('/vendors/:id/activate',          superAdminAuth, activateVendor);
router.get('/stats',                         superAdminAuth, getStats);

/* ---- Profile ---- */
router.put('/profile', superAdminAuth, updateSuperAdminProfile);

/* ---- Change Password (OTP flow) ---- */
router.post('/change-password/request-otp', superAdminAuth, requestChangePasswordOtp); // needs saToken to know who to send OTP to
router.post('/change-password/verify-otp',  verifyChangePasswordOtp);                  // auth via signed otpToken in body
router.post('/change-password/reset',       resetSuperAdminPassword);                  // auth via Bearer resetToken header


export default router;
