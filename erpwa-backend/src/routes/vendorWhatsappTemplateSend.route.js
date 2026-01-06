import express from "express";
import fetch from "node-fetch";
import prisma from "../prisma.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { requireRoles } from "../middleware/requireRole.middleware.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { decrypt } from "../utils/encryption.js";

const router = express.Router();

/**
 * ===============================
 * SEND APPROVED TEMPLATE
 * ===============================
 */
router.post(
  "/send-template",
  authenticate,
  requireRoles(["vendor_owner", "vendor_admin", "sales"]),
  asyncHandler(async (req, res) => {
    const { to, templateId } = req.body;

    if (!to || !templateId) {
      return res.status(400).json({
        message: "to and templateId are required",
      });
    }

    /* ===============================
       1️⃣ Load vendor + WhatsApp config
       =============================== */
    const vendor = await prisma.vendor.findUnique({
      where: { id: req.user.vendorId },
    });

    if (!vendor?.whatsappAccessToken || !vendor.whatsappPhoneNumberId) {
      return res.status(400).json({
        message: "WhatsApp is not configured for this vendor",
      });
    }

    const accessToken = decrypt(vendor.whatsappAccessToken);

    /* ===============================
       2️⃣ Load approved template + language
       =============================== */
    const template = await prisma.template.findFirst({
      where: {
        id: templateId,
        vendorId: vendor.id,
        status: "approved",
      },
      include: {
        languages: {
          where: { metaStatus: "approved" },
          take: 1,
        },
      },
    });

    if (!template || template.languages.length === 0) {
      return res.status(400).json({
        message: "Template is not approved or not found",
      });
    }

    const language = template.languages[0];

    /* ===============================
       3️⃣ Find or create Lead + Conversation
       =============================== */
    const now = new Date();

    const lead = await prisma.lead.upsert({
      where: {
        vendorId_phoneNumber: {
          vendorId: vendor.id,
          phoneNumber: to,
        },
      },
      update: {
        lastContactedAt: now,
      },
      create: {
        vendorId: vendor.id,
        phoneNumber: to,
        whatsappOptIn: true,
        optInSource: "template",
        optInAt: now,
      },
    });

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
        sessionStartedAt: now,
        lastMessageAt: now,
        sessionExpiresAt,
        isOpen: true,
      },
    });

    /* ===============================
       4️⃣ Send template to Meta
       =============================== */
    const metaResp = await fetch(
      `https://graph.facebook.com/v24.0/${vendor.whatsappPhoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to,
          type: "template",
          template: {
            name: template.metaTemplateName,
            language: {
              code: language.language,
            },
          },
        }),
      }
    );

    const metaData = await metaResp.json();

    if (!metaResp.ok) {
      return res.status(400).json({
        message: "Failed to send WhatsApp template",
        metaError: metaData,
      });
    }

    /* ===============================
       5️⃣ Store outbound message
       =============================== */
    const message = await prisma.message.create({
      data: {
        vendor: {
          connect: { id: vendor.id },
        },
        conversation: {
          connect: { id: conversation.id },
        },
        direction: "outbound",
        channel: "whatsapp",
        messageType: "template",
        content: template.displayName,
        whatsappMessageId: metaData.messages?.[0]?.id,
        status: "sent",
        outboundPayload: metaData,
      },
    });

    res.json({
      success: true,
      messageId: message.id,
      whatsappMessageId: metaData.messages?.[0]?.id,
      conversationId: conversation.id,
      leadId: lead.id,
    });
  })
);

export default router;
