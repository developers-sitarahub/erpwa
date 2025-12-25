import express from "express";
import fetch from "node-fetch";
import prisma from "../prisma.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { requireRoles } from "../middleware/requireRole.middleware.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { decrypt } from "../utils/encryption.js";

const router = express.Router();

router.post(
  "/send-message",
  authenticate,
  requireRoles(["vendor_owner", "vendor_admin", "sales"]),
  asyncHandler(async (req, res) => {
    const { conversationId, text } = req.body;

    if (!conversationId || !text) {
      return res.status(400).json({
        message: "conversationId and text are required",
      });
    }

    // 1️⃣ Load conversation
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        lead: true,
        vendor: true,
      },
    });

    if (!conversation || !conversation.isOpen) {
      return res.status(400).json({
        message: "Conversation is closed",
      });
    }

    // 2️⃣ Check 24h session
    if (
      !conversation.sessionExpiresAt ||
      conversation.sessionExpiresAt < new Date()
    ) {
      return res.status(400).json({
        message: "24-hour window expired. Use template message.",
      });
    }

    // 3️⃣ Decrypt token
    const accessToken = decrypt(conversation.vendor.whatsappAccessToken);

    // 4️⃣ Send text message
    const response = await fetch(
      `https://graph.facebook.com/v19.0/${conversation.vendor.whatsappPhoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: conversation.lead.phoneNumber,
          type: "text",
          text: { body: text },
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(400).json({
        message: "Failed to send WhatsApp message",
        metaError: data,
      });
    }

    // 5️⃣ Store outbound message
    const msg = await prisma.message.create({
      data: {
        vendorId: conversation.vendorId,
        conversationId: conversation.id,
        senderId: req.user.id,
        direction: "outbound",
        messageType: "text",
        content: text,
        whatsappMessageId: data.messages?.[0]?.id,
        status: "sent",
      },
    });

    res.json({
      message: "Message sent",
      data: msg,
    });
  })
);

export default router;
