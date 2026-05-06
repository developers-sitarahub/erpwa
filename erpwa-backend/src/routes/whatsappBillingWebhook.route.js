/**
 * WhatsApp Billing Webhook Route
 * 
 * POST /webhook/whatsapp-billing
 * 
 * Processes Meta webhook status events specifically for billing:
 *  - Tracks messages in WhatsappMessage table
 *  - Processes new conversations for billing
 *  - Calculates Meta cost + platform markup
 *  - Deducts from vendor wallet
 * 
 * This route runs IN ADDITION to the main webhook handler.
 * It is designed to be idempotent and never fail (always returns 200).
 */

import express from "express";
import { resolveVendorFromWebhook } from "../middleware/whatsappVendor.middleware.js";
import {
  trackMessage,
  processConversationBilling,
} from "../services/whatsappBilling.service.js";

const router = express.Router();

/* ===============================
   WEBHOOK BILLING PROCESSOR
=============================== */
router.post("/", resolveVendorFromWebhook, async (req, res) => {
  const startTime = Date.now();

  try {
    const vendor = req.vendor;

    if (!vendor) {
      console.log("📋 [Billing] No vendor resolved, skipping billing");
      return res.sendStatus(200);
    }

    const entry = req.body?.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;

    if (!value) {
      return res.sendStatus(200);
    }

    const vendorId = vendor.id;
    const vendorCountry = vendor.country || "India";

    /* ─── Process Message Statuses ──────────────────────────── */
    if (value.statuses?.length) {
      for (const waStatus of value.statuses) {
        const waMessageId = waStatus.id;
        const status = waStatus.status; // sent | delivered | read | failed
        const phoneNumber = waStatus.recipient_id;

        // Extract conversation info
        const conversationData = waStatus.conversation;
        const conversationId = conversationData?.id || null;
        const pricingData = waStatus.pricing;
        const pricingCategory = pricingData?.category?.toLowerCase() || null;
        const billable = pricingData?.billable !== false;

        // 1️⃣ Track the message
        await trackMessage({
          vendorId,
          waMessageId,
          phoneNumber,
          direction: "outbound",
          messageType: waStatus.message?.type || null,
          status,
          conversationId,
          pricingCategory,
        });

        // 2️⃣ Process conversation billing (only on first status with conversation data)
        if (conversationId && pricingCategory) {
          await processConversationBilling({
            vendorId,
            conversationId,
            category: pricingCategory,
            billable,
            country: vendorCountry,
          });
        }

        console.log(
          `📋 [Billing] Processed: vendor=${vendorId} | ` +
          `msg=${waMessageId} | status=${status} | ` +
          `conversation=${conversationId || "N/A"} | ` +
          `category=${pricingCategory || "N/A"} | ` +
          `${Date.now() - startTime}ms`
        );
      }
    }

    /* ─── Process Inbound Messages (for message count tracking) ─ */
    if (value.messages?.length) {
      for (const msg of value.messages) {
        await trackMessage({
          vendorId,
          waMessageId: msg.id,
          phoneNumber: msg.from,
          direction: "inbound",
          messageType: msg.type,
          status: "received",
        });
      }
    }

    return res.sendStatus(200);
  } catch (err) {
    console.error("❌ [Billing] Webhook error:", err.message);
    // NEVER fail the webhook – Meta will retry and flood the system
    return res.sendStatus(200);
  }
});

export default router;
