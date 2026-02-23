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
 * Helper → Generate PIN
 */
const generatePin = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

/**
 * Helper → Register Phone Number
 */
const registerPhoneNumber = async (phoneNumberId, token) => {
  const pin = generatePin();

  // ✅ Check current status BEFORE registering
  const statusResp = await fetch(
    `https://graph.facebook.com/v24.0/${phoneNumberId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  const statusData = await statusResp.json();

  if (statusData?.code_verification_status === "VERIFIED") {
    console.log("✅ Number already verified/registered");
    return { success: true };
  }

  // 🔥 Only register if truly needed
  const resp = await fetch(
    `https://graph.facebook.com/v24.0/${phoneNumberId}/register`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        pin,
        tier: "prod",
      }),
    },
  );

  const data = await resp.json();

  if (!resp.ok) {
    // ✅ Already registered → treat as success
    if (data?.error?.code === 131045) {
      console.log("✅ Number already registered");
      return { success: true };
    }

    return { success: false, error: data };
  }

  console.log("✅ Number registered");
  return { success: true };
};

/**
 * Helper → Subscribe App
 */
const subscribeApp = async (whatsappBusinessId, token) => {
  const resp = await fetch(
    `https://graph.facebook.com/v24.0/${whatsappBusinessId}/subscribed_apps`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    },
  );

  const data = await resp.json();

  if (!resp.ok) {
    if (data?.error?.message?.includes("already subscribed")) {
      console.log("✅ App already subscribed");
      return { success: true };
    }

    return { success: false, error: data };
  }

  console.log("✅ App subscribed");
  return { success: true };
};

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
        metaError: err?.error || err,
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
    const { code, whatsappBusinessId, whatsappPhoneNumberId } = req.body;

    if (!code || !whatsappBusinessId || !whatsappPhoneNumberId) {
      return res.status(400).json({
        message: "Missing embedded signup data",
      });
    }

    // 🔍 Debugging Logs
    console.log("🔹 Exchanging code for token...");
    console.log("🔹 App ID:", process.env.META_APP_ID);
    console.log(
      "🔹 App Secret (First 5 chars):",
      process.env.META_APP_SECRET?.substring(0, 5) + "...",
    );

    const tokenResp = await fetch(
      "https://graph.facebook.com/v24.0/oauth/access_token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          client_id: process.env.META_APP_ID,
          client_secret: process.env.META_APP_SECRET,
          // redirect_uri: process.env.META_OAUTH_REDIRECT_URI, // ❌ Often causes mismatch for JS SDK flows
          code,
          grant_type: "authorization_code",
        }),
      },
    );

    const tokenData = await tokenResp.json();

    if (!tokenResp.ok || !tokenData.access_token) {
      console.error("❌ META TOKEN ERROR:", JSON.stringify(tokenData, null, 2));
      return res.status(400).json({
        message: "Token exchange failed",
        metaError: tokenData,
      });
    }

    if (!tokenData.access_token) {
      return res.status(400).json({
        message: "Token exchange failed",
      });
    }

    const accessToken = tokenData.access_token;

    /**
     * ✅ STEP 1 → Register Phone Number
     */
    const registration = await registerPhoneNumber(
      whatsappPhoneNumberId,
      accessToken,
    );

    if (!registration.success) {
      await prisma.vendor.update({
        where: { id: req.user.vendorId },
        data: {
          whatsappStatus: "error",
          whatsappLastError: JSON.stringify(registration.error),
        },
      });

      return res.status(400).json({
        message: "Phone number registration failed",
        metaError: registration.error,
      });
    }

    /**
     * ✅ OPTIONAL → Phone Health Check (Add Here)
     */
    const phoneResp = await fetch(
      `https://graph.facebook.com/v24.0/${whatsappBusinessId}/phone_numbers`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    const phoneData = await phoneResp.json();

    console.log("📱 Phone Health:", JSON.stringify(phoneData, null, 2));

    /**
     * ✅ STEP 2 → Subscribe App
     */
    const subscription = await subscribeApp(whatsappBusinessId, accessToken);

    if (!subscription.success) {
      await prisma.vendor.update({
        where: { id: req.user.vendorId },
        data: {
          whatsappStatus: "error",
          whatsappLastError: JSON.stringify(subscription.error),
        },
      });

      return res.status(400).json({
        message: "Webhook subscription failed",
        metaError: subscription.error,
      });
    }

    await prisma.vendor.update({
      where: { id: req.user.vendorId },
      data: {
        whatsappBusinessId,
        whatsappPhoneNumberId,
        whatsappAccessToken: encrypt(accessToken),
        whatsappStatus: "connected",
        whatsappVerifiedAt: new Date(),
        whatsappLastError: null,
      },
    });

    res.json({ success: true });
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
