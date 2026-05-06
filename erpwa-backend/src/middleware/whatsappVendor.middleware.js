/**
 * WhatsApp Vendor Resolution Middleware
 *
 * Resolves vendor from the WhatsApp phone_number_id in webhook payloads.
 * This middleware is used specifically for billing-related webhook processing.
 */

import prisma from "../prisma.js";

/**
 * Look up the vendor associated with a WhatsApp phone_number_id.
 *
 * @param {string} phoneNumberId - Meta's phone_number_id from webhook metadata
 * @returns {Promise<object|null>} Vendor record or null
 */
export async function getVendorFromPhone(phoneNumberId) {
  if (!phoneNumberId) {
    return null;
  }

  try {
    const vendor = await prisma.vendor.findFirst({
      where: { whatsappPhoneNumberId: phoneNumberId },
      select: {
        id: true,
        name: true,
        whatsappPhoneNumberId: true,
        whatsappBusinessId: true,
        country: true,
      },
    });

    return vendor;
  } catch (err) {
    console.error("❌ getVendorFromPhone error:", err.message);
    return null;
  }
}

/**
 * Express middleware that attaches vendor info to req.vendor
 * based on the WhatsApp phone_number_id in the webhook payload.
 *
 * Usage: router.post("/", resolveVendorFromWebhook, handler)
 */
export async function resolveVendorFromWebhook(req, res, next) {
  try {
    const entry = req.body?.entry?.[0];
    const change = entry?.changes?.[0];
    const phoneNumberId = change?.value?.metadata?.phone_number_id;
    const wabaId = entry?.id;

    let vendor = await getVendorFromPhone(phoneNumberId);

    // Fallback: resolve by WABA ID
    if (!vendor && wabaId) {
      vendor = await prisma.vendor.findFirst({
        where: { whatsappBusinessId: wabaId },
        select: {
          id: true,
          name: true,
          whatsappPhoneNumberId: true,
          whatsappBusinessId: true,
          country: true,
        },
      });
    }

    req.vendor = vendor; // May be null – handler should check
    req.phoneNumberId = phoneNumberId;
    req.wabaId = wabaId;

    next();
  } catch (err) {
    console.error("❌ resolveVendorFromWebhook error:", err.message);
    req.vendor = null;
    next(); // Don't block webhook – Meta expects 200
  }
}
