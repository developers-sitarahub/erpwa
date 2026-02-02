import express from "express";
import fetch from "node-fetch";
import prisma from "../prisma.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { requireRoles } from "../middleware/requireRole.middleware.js";
import { encrypt } from "../utils/encryption.js";

const router = express.Router();

console.log("✅ vendorWhatsapp routes loaded");

/**
 * ===============================
 * VENDOR WHATSAPP SETUP
 * ===============================
 * Access: vendor_owner only
 */
router.post(
  "/whatsapp/setup",
  authenticate,
  requireRoles(["vendor_owner"]),
  asyncHandler(async (req, res) => {
    const { whatsappBusinessId, whatsappPhoneNumberId, whatsappAccessToken } =
      req.body;

    // 1️⃣ Validate input
    if (!whatsappBusinessId || !whatsappPhoneNumberId || !whatsappAccessToken) {
      return res.status(400).json({
        message:
          "WhatsApp Business ID, Phone Number ID, and Access Token are required",
      });
    }

    // 2️⃣ Validate credentials with Meta API
    const metaResp = await fetch(
      `https://graph.facebook.com/v24.0/${whatsappPhoneNumberId}?fields=display_phone_number`,
      {
        headers: {
          Authorization: `Bearer ${whatsappAccessToken}`,
        },
      },
    );

    if (!metaResp.ok) {
      const err = await metaResp.json();
      return res.status(400).json({
        message: "Invalid WhatsApp credentials",
        metaError: err?.error?.message,
      });
    }

    // 3️⃣ Encrypt access token
    const encryptedToken = encrypt(whatsappAccessToken);

    // 4️⃣ Save credentials to Vendor
    await prisma.vendor.update({
      where: { id: req.user.vendorId },
      data: {
        whatsappBusinessId,
        whatsappPhoneNumberId,
        whatsappAccessToken: encryptedToken, // 🔐 encrypted at rest
        whatsappStatus: "connected",
        whatsappVerifiedAt: new Date(),
        whatsappLastError: null,
      },
    });

    res.json({
      message: "WhatsApp successfully connected",
    });
  }),
);

/**
 * ===============================
 * EMBEDDED SIGNUP CALLBACK
 * ===============================
 * Access: vendor_owner only
 * Exchanges the OAuth code for an access token
 */
router.post(
  "/whatsapp/embedded-setup",
  authenticate,
  requireRoles(["vendor_owner"]),
  asyncHandler(async (req, res) => {
    const { code, wabaId, phoneNumberId } = req.body;

    if (!code || !wabaId || !phoneNumberId) {
      return res.status(400).json({
        message: "Code, WABA ID and Phone Number ID are required",
      });
    }

    const appId = process.env.META_APP_ID;
    const appSecret = process.env.META_APP_SECRET;

    if (!appId || !appSecret) {
      return res.status(500).json({
        message: "Meta OAuth configuration is missing",
      });
    }

    // 1️⃣ Exchange code for access token (Embedded Signup flow)
    const tokenResp = await fetch(
      "https://graph.facebook.com/v24.0/oauth/access_token",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: appId,
          client_secret: appSecret,
          code,
        }),
      },
    );

    const tokenData = await tokenResp.json();

    if (!tokenResp.ok || !tokenData.access_token) {
      return res.status(400).json({
        message: "Failed to exchange code for access token",
        metaError: tokenData?.error?.message,
      });
    }

    const accessToken = tokenData.access_token;

    // 2️⃣ (Optional but recommended) verify phone number exists
    const phoneCheck = await fetch(
      `https://graph.facebook.com/v24.0/${phoneNumberId}?fields=display_phone_number`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    );

    if (!phoneCheck.ok) {
      const err = await phoneCheck.json();
      return res.status(400).json({
        message: "Phone number verification failed",
        metaError: err?.error?.message,
      });
    }

    // 3️⃣ Encrypt token
    const encryptedToken = encrypt(accessToken);

    // 4️⃣ Save directly (trust Meta session IDs)
    await prisma.vendor.update({
      where: { id: req.user.vendorId },
      data: {
        whatsappBusinessId: wabaId,
        whatsappPhoneNumberId: phoneNumberId,
        whatsappAccessToken: encryptedToken,
        whatsappStatus: "connected",
        whatsappVerifiedAt: new Date(),
        whatsappLastError: null,
      },
    });

    res.json({
      message: "WhatsApp connected successfully via Embedded Signup 🎉",
      whatsappBusinessId: wabaId,
      whatsappPhoneNumberId: phoneNumberId,
    });
  }),
);

/**
 * ===============================
 * GET WHATSAPP CONFIG (SAFE)
 * ===============================
 * Access: vendor_owner, vendor_admin
 */
router.get(
  "/whatsapp",
  authenticate,
  requireRoles(["vendor_owner", "vendor_admin"]),
  asyncHandler(async (req, res) => {
    const vendor = await prisma.vendor.findUnique({
      where: { id: req.user.vendorId },
      select: {
        whatsappBusinessId: true,
        whatsappPhoneNumberId: true,
        whatsappStatus: true,
        whatsappVerifiedAt: true,
        whatsappLastError: true,
      },
    });

    res.json(vendor);
  }),
);

export default router;
