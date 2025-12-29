import express from "express";
import fetch from "node-fetch";
import prisma from "../prisma.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { requireRoles } from "../middleware/requireRole.middleware.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { decrypt } from "../utils/encryption.js";
import { getIO } from "../socket.js";

const router = express.Router();

router.post(
  "/send-message",
  authenticate,
  requireRoles(["vendor_owner", "vendor_admin", "sales"]),
  asyncHandler(async (req, res) => {
    const { conversationId, text, replyToMessageId } = req.body;

    /* ===============================
       1️⃣ Validate input
    =============================== */
    if (!conversationId || !text || !text.trim()) {
      return res.status(400).json({
        message: "conversationId and text are required",
      });
    }

    /* ===============================
       2️⃣ Load conversation + relations
    =============================== */
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        lead: true,
        vendor: true,
      },
    });

    if (!conversation) {
      return res.status(404).json({
        message: "Conversation not found",
      });
    }

    if (!conversation.isOpen) {
      return res.status(400).json({
        message: "Conversation is closed",
      });
    }

    /* ===============================
       3️⃣ Check 24h WhatsApp window
    =============================== */
    if (
      !conversation.sessionExpiresAt ||
      conversation.sessionExpiresAt < new Date()
    ) {
      return res.status(400).json({
        message: "24-hour window expired. Use template message.",
      });
    }

    /* ===============================
       4️⃣ Validate WhatsApp config
    =============================== */
    if (
      !conversation.vendor?.whatsappAccessToken ||
      !conversation.vendor?.whatsappPhoneNumberId
    ) {
      return res.status(400).json({
        message: "WhatsApp is not configured for this vendor",
      });
    }

    /* ===============================
       5️⃣ Decrypt access token
    =============================== */
    let accessToken;
    try {
      accessToken = decrypt(conversation.vendor.whatsappAccessToken);
    } catch {
      return res.status(400).json({
        message: "Invalid WhatsApp access token",
      });
    }

    /* ===============================
       6️⃣ Send message to WhatsApp
    =============================== */
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
          ...(replyToMessageId
            ? {
                context: {
                  message_id: replyToMessageId,
                },
              }
            : {}),
        }),
      }
    );

    const metaData = await response.json();

    const whatsappMessageId = metaData.messages?.[0]?.id;

    if (!whatsappMessageId) {
      return res.status(500).json({
        message: "WhatsApp did not return message ID",
        metaData,
      });
    }

    if (!response.ok) {
      return res.status(400).json({
        message: "Failed to send WhatsApp message",
        metaError: metaData,
      });
    }

    /* ===============================
       7️⃣ Persist outbound message
    =============================== */
    const message = await prisma.message.create({
      data: {
        vendorId: conversation.vendorId,
        conversationId: conversation.id,
        senderId: req.user.id,
        direction: "outbound",
        channel: "whatsapp",
        messageType: "text",
        content: text,
        whatsappMessageId,
        replyToMessageId,
        status: "sent",
        outboundPayload: metaData,
      },
    });

    /* ===============================
       🔥 EMIT REALTIME MESSAGE (SAFE)
    =============================== */
    try {
      const io = getIO();

      io.to(`conversation:${conversation.id}`).emit("message:new", {
        id: message.id,
        whatsappMessageId: message.whatsappMessageId,
        text: message.content,
        sender: "executive",
        timestamp: new Date(message.createdAt).toISOString(),
        status: "sent",

        // 🔥 THIS WAS MISSING
        replyToMessageId: message.replyToMessageId,
      });

      io.to(`vendor:${conversation.vendorId}`).emit("inbox:update", {
        conversationId: conversation.id,
      });
    } catch {
      // socket failure must NEVER break API
    }

    /* ===============================
       8️⃣ Update conversation ordering
    =============================== */
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: {
        lastMessageAt: new Date(),
        sessionExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    /* ===============================
       9️⃣ Respond success
    =============================== */
    res.json({
      message: "Message sent",
      data: message,
    });
  })
);

export default router;
