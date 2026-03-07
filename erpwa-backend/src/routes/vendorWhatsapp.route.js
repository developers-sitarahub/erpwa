import express from "express";
import fetch from "node-fetch";
import prisma from "../prisma.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { requireRoles } from "../middleware/requireRole.middleware.js";
import { encrypt, decrypt } from "../utils/encryption.js";

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

  // 🔥 Always attempt to register to ensure the node is usable.

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
      `https://graph.facebook.com/v24.0/${whatsappPhoneNumberId}?fields=display_phone_number,verified_name,code_verification_status,quality_rating,platform_type,status`,
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

    const phoneData = await metaResp.json();
    const whatsappVerificationStatus =
      phoneData?.code_verification_status || "NOT_VERIFIED";
    const whatsappQualityRating = phoneData?.quality_rating || "UNKNOWN";
    const whatsappVerifiedName = phoneData?.verified_name || null;
    const whatsappDisplayPhoneNumber = phoneData?.display_phone_number || null;

    // Attempt to get tier if possible via separate endpoint but keep UI fast
    let whatsappMessagingTier = "UNKNOWN";
    try {
      const phoneHealthResp = await fetch(
        `https://graph.facebook.com/v24.0/${whatsappBusinessId}/phone_numbers`,
        { headers: { Authorization: `Bearer ${whatsappAccessToken}` } },
      );
      const phoneHealthData = await phoneHealthResp.json();
      if (phoneHealthData?.data && Array.isArray(phoneHealthData.data)) {
        const numberObj = phoneHealthData.data.find(
          (n) => n.id === whatsappPhoneNumberId,
        );
        if (numberObj) {
          whatsappMessagingTier = numberObj.messaging_limit_tier || "UNKNOWN";
        }
      }
    } catch (e) {
      console.error("Could not fetch tier", e);
    }

    // 3️⃣ Attempt to Register Phone Number
    const registration = await registerPhoneNumber(
      whatsappPhoneNumberId,
      whatsappAccessToken
    );

    if (!registration.success) {
      return res.status(400).json({
        message: "Phone number registration failed",
        metaError: registration.error,
      });
    }

    // 4️⃣ Attempt to Subscribe App
    const subscription = await subscribeApp(
      whatsappBusinessId,
      whatsappAccessToken
    );

    if (!subscription.success) {
      return res.status(400).json({
        message: "Webhook subscription failed",
        metaError: subscription.error,
      });
    }

    // 5️⃣ Encrypt access token
    const encryptedToken = encrypt(whatsappAccessToken);

    // 6️⃣ Save credentials to Vendor
    await prisma.vendor.update({
      where: { id: req.user.vendorId },
      data: {
        whatsappBusinessId,
        whatsappPhoneNumberId,
        whatsappAccessToken: encryptedToken, // 🔐 encrypted at rest
        whatsappStatus: "connected",
        whatsappVerifiedAt: new Date(),
        whatsappLastError: null,
        whatsappVerificationStatus,
        whatsappQualityRating,
        whatsappMessagingTier,
        whatsappVerifiedName,
        whatsappDisplayPhoneNumber,
      },
    });

    res.json({
      message: "WhatsApp successfully connected",
      data: {
        whatsappVerificationStatus,
        whatsappQualityRating,
        whatsappMessagingTier,
        whatsappVerifiedName,
        whatsappDisplayPhoneNumber,
      },
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

    const qs = new URLSearchParams({
      client_id: process.env.META_APP_ID,
      client_secret: process.env.META_APP_SECRET,
      code,
    });

    const tokenResp = await fetch(
      `https://graph.facebook.com/v24.0/oauth/access_token?${qs.toString()}`,
      {
        method: "GET",
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
     * ✅ Check Verification Status & Quality Rating
     */
    const phoneDetailResp = await fetch(
      `https://graph.facebook.com/v24.0/${whatsappPhoneNumberId}?fields=display_phone_number,verified_name,code_verification_status,quality_rating,platform_type,status`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );
    const phoneDetailData = await phoneDetailResp.json();
    const whatsappVerificationStatus =
      phoneDetailData?.code_verification_status || "NOT_VERIFIED";
    const whatsappQualityRating = phoneDetailData?.quality_rating || "UNKNOWN";
    const whatsappVerifiedName = phoneDetailData?.verified_name || null;
    const whatsappDisplayPhoneNumber =
      phoneDetailData?.display_phone_number || null;

    // Tier fetch
    let whatsappMessagingTier = "UNKNOWN";
    try {
      const phoneHealthResp = await fetch(
        `https://graph.facebook.com/v24.0/${whatsappBusinessId}/phone_numbers`,
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
      const phoneHealthData = await phoneHealthResp.json();
      if (phoneHealthData?.data && Array.isArray(phoneHealthData.data)) {
        const numberObj = phoneHealthData.data.find(
          (n) => n.id === whatsappPhoneNumberId,
        );
        if (numberObj) {
          whatsappMessagingTier = numberObj.messaging_limit_tier || "UNKNOWN";
        }
      }
    } catch (e) { }

    console.log("📱 Phone Details:", JSON.stringify(phoneDetailData, null, 2));

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
        whatsappVerificationStatus,
        whatsappQualityRating,
        whatsappMessagingTier,
        whatsappVerifiedName,
        whatsappDisplayPhoneNumber,
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
        whatsappVerificationStatus: true,
        whatsappQualityRating: true,
        whatsappMessagingTier: true,
        whatsappVerifiedName: true,
        whatsappDisplayPhoneNumber: true,
      },
    });

    res.json(vendor);
  }),
);

/**
 * ===============================
 * REFRESH WHATSAPP STATUS
 * ===============================
 * Access: vendor_owner, vendor_admin
 */
router.post(
  "/whatsapp/refresh-status",
  authenticate,
  requireRoles(["vendor_owner", "vendor_admin"]),
  asyncHandler(async (req, res) => {
    const vendor = await prisma.vendor.findUnique({
      where: { id: req.user.vendorId },
    });

    if (
      !vendor ||
      !vendor.whatsappAccessToken ||
      !vendor.whatsappPhoneNumberId
    ) {
      return res.status(400).json({ message: "WhatsApp not fully configured" });
    }

    const { whatsappPhoneNumberId, whatsappBusinessId } = vendor;
    const whatsappAccessToken = decrypt(vendor.whatsappAccessToken);

    try {
      const phoneDetailResp = await fetch(
        `https://graph.facebook.com/v24.0/${whatsappPhoneNumberId}?fields=display_phone_number,verified_name,code_verification_status,quality_rating,platform_type,status`,
        { headers: { Authorization: `Bearer ${whatsappAccessToken}` } },
      );
      const phoneDetailData = await phoneDetailResp.json();

      const whatsappVerificationStatus =
        phoneDetailData?.code_verification_status || "NOT_VERIFIED";
      const whatsappQualityRating =
        phoneDetailData?.quality_rating ||
        vendor.whatsappQualityRating ||
        "UNKNOWN";
      const whatsappVerifiedName =
        phoneDetailData?.verified_name || vendor.whatsappVerifiedName || null;
      const whatsappDisplayPhoneNumber =
        phoneDetailData?.display_phone_number ||
        vendor.whatsappDisplayPhoneNumber ||
        null;

      let whatsappMessagingTier = vendor.whatsappMessagingTier || "UNKNOWN";
      try {
        const phoneHealthResp = await fetch(
          `https://graph.facebook.com/v24.0/${whatsappBusinessId}/phone_numbers`,
          { headers: { Authorization: `Bearer ${whatsappAccessToken}` } },
        );
        const phoneHealthData = await phoneHealthResp.json();
        if (phoneHealthData?.data && Array.isArray(phoneHealthData.data)) {
          const numberObj = phoneHealthData.data.find(
            (n) => n.id === whatsappPhoneNumberId,
          );
          if (numberObj) {
            whatsappMessagingTier =
              numberObj.messaging_limit_tier || whatsappMessagingTier;
          }
        }
      } catch (e) { }

      const updatedVendor = await prisma.vendor.update({
        where: { id: req.user.vendorId },
        data: {
          whatsappVerificationStatus,
          whatsappQualityRating,
          whatsappMessagingTier,
          whatsappVerifiedName,
          whatsappDisplayPhoneNumber,
        },
        select: {
          whatsappBusinessId: true,
          whatsappPhoneNumberId: true,
          whatsappStatus: true,
          whatsappVerifiedAt: true,
          whatsappLastError: true,
          whatsappVerificationStatus: true,
          whatsappQualityRating: true,
          whatsappMessagingTier: true,
          whatsappVerifiedName: true,
          whatsappDisplayPhoneNumber: true,
        },
      });

      res.json(updatedVendor);
    } catch (err) {
      console.error("Refresh status error:", err);
      res.status(500).json({ message: "Failed to refresh WhatsApp status." });
    }
  }),
);

export default router;
