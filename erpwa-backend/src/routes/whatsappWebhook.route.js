import express from "express";
import prisma from "../prisma.js";

const router = express.Router();

/**
 * ===============================
 * WEBHOOK VERIFICATION (GET)
 * ===============================
 */
router.get("/whatsapp", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }

  return res.sendStatus(403);
});

/**
 * ===============================
 * WEBHOOK EVENTS (POST)
 * ===============================
 */
router.post("/whatsapp", async (req, res) => {
  try {
    const entry = req.body.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;

    if (!value) return res.sendStatus(200);

    const phoneNumberId = value.metadata?.phone_number_id;

    // 1️⃣ Find vendor by phone_number_id
    const vendor = await prisma.vendor.findFirst({
      where: { whatsappPhoneNumberId: phoneNumberId },
    });

    if (!vendor) {
      console.warn("⚠️ Vendor not found for phone number ID", phoneNumberId);
      return res.sendStatus(200);
    }

    /* ================= INBOUND MESSAGE ================= */
    if (value.messages?.length) {
      const message = value.messages[0];
      const from = message.from;
      const now = new Date();

      // 2️⃣ Find or create Lead
      const lead = await prisma.lead.upsert({
        where: {
          vendorId_phoneNumber: {
            vendorId: vendor.id,
            phoneNumber: from,
          },
        },
        update: {
          lastContactedAt: now,
        },
        create: {
          vendorId: vendor.id,
          phoneNumber: from,
          whatsappOptIn: true,
          optInSource: "whatsapp",
          optInMessage: message.text?.body,
          optInAt: now,
        },
      });

      // 3️⃣ Find or create Conversation
      const sessionExpiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      const conversation = await prisma.conversation.upsert({
        where: {
          vendorId_leadId: {
            vendorId: vendor.id,
            leadId: lead.id,
          },
        },
        update: {
          lastMessageAt: now,
          sessionExpiresAt,
          isOpen: true,
        },
        create: {
          vendorId: vendor.id,
          leadId: lead.id,
          channel: "whatsapp",
          lastMessageAt: now,
          sessionStartedAt: now,
          sessionExpiresAt,
        },
      });

      // 4️⃣ Store inbound Message
      await prisma.message.create({
        data: {
          vendorId: vendor.id,
          conversationId: conversation.id,
          direction: "inbound",
          messageType: message.type,
          content: message.text?.body,
          inboundPayload: message,
          whatsappMessageId: message.id,
          status: "received",
        },
      });

      console.log("📩 WhatsApp message stored", {
        vendorId: vendor.id,
        leadId: lead.id,
        conversationId: conversation.id,
      });
    }

    /* ================= STATUS UPDATE ================= */
    if (value.statuses?.length) {
      const status = value.statuses[0];

      await prisma.message.updateMany({
        where: { whatsappMessageId: status.id },
        data: {
          status: status.status,
          errorCode: status.errors?.[0]?.code,
        },
      });
    }

    return res.sendStatus(200);
  } catch (err) {
    console.error("❌ WhatsApp webhook error:", err);
    return res.sendStatus(200);
  }
});

export default router;
