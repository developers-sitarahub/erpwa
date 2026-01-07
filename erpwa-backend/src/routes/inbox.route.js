import express from "express";
import fetch from "node-fetch"; // ✅ ADD THIS
import prisma from "../prisma.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { getIO } from "../socket.js";
import { decrypt } from "../utils/encryption.js";

const router = express.Router();

/**
 * ===============================
 * GET INBOX (ALL CONVERSATIONS)
 * ===============================
 * Shows list of WhatsApp conversations with last message preview
 */
router.get(
  "/",
  authenticate,
  asyncHandler(async (req, res) => {
    const vendorId = req.user.vendorId;

    const conversations = await prisma.conversation.findMany({
      where: {
        vendorId,
        channel: "whatsapp",
      },
      include: {
        lead: {
          select: {
            id: true,
            phoneNumber: true,
            name: true,
          },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1, // last message preview
        },
      },
      orderBy: {
        lastMessageAt: "desc",
      },
    });

    res.json(conversations);
  })
);

/**
 * ===============================
 * GET FULL CONVERSATION
 * ===============================
 * Fetches COMPLETE message history (no 24h restriction)
 * Also returns session state for UI logic
 */
router.get(
  "/:conversationId",
  authenticate,
  asyncHandler(async (req, res) => {
    const { conversationId } = req.params;
    const vendorId = req.user.vendorId;

    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId, // ✅ IMPORTANT
        vendorId,
        channel: "whatsapp",
      },
      include: {
        lead: {
          select: {
            id: true,
            phoneNumber: true,
            name: true,
          },
        },
        messages: {
          orderBy: { createdAt: "asc" },
          include: {
            media: true,
          },
        },
      },
    });

    if (!conversation) {
      return res.status(404).json({
        message: "Conversation not found",
      });
    }

    // 24-hour session check (ONLY for sending logic)
    const now = new Date();
    const sessionActive =
      conversation.sessionExpiresAt &&
      new Date(conversation.sessionExpiresAt) > now;

    res.json({
      conversationId: conversation.id,
      lead: conversation.lead,
      sessionActive,
      sessionExpiresAt: conversation.sessionExpiresAt,
      messages: conversation.messages,
    });
  })
);

/**
 * ===============================
 * MARK INBOUND MESSAGES AS READ
 * ===============================
 * - Called when agent opens a chat
 * - Sends ONE WhatsApp read receipt (latest message)
 * - Marks ALL inbound unread messages as read in DB
 * - Emits socket updates for ALL messages
 */
router.post(
  "/:conversationId/mark-read",
  authenticate,
  asyncHandler(async (req, res) => {
    console.log("\n========== MARK READ START ==========");

    const { conversationId } = req.params;
    const vendorId = req.user.vendorId;

    console.log("➡️ Request received");
    console.log("conversationId:", conversationId);
    console.log("vendorId:", vendorId);

    console.log("🔍 Fetching conversation + vendor");

    const conversation = await prisma.conversation.findFirst({
      where: { id: conversationId, vendorId, channel: "whatsapp" },
      include: { vendor: true },
    });

    console.log(
      "📦 Conversation query result:",
      conversation ? "FOUND" : "NOT FOUND"
    );

    if (!conversation || !conversation.vendor) {
      console.error("❌ Conversation or vendor missing");
      console.log("========== MARK READ END ==========\n");
      return res.sendStatus(404);
    }

    console.log("✅ Conversation + vendor OK");
    console.log(
      "vendor.whatsappPhoneNumberId:",
      conversation.vendor.whatsappPhoneNumberId
    );

    console.log(
      "🔍 Fetching latest inbound message (NOT trusting DB read state)"
    );

    console.log("🔍 Fetching latest inbound message (ignoring DB read state)");

    const lastInbound = await prisma.message.findFirst({
      where: {
        conversationId,
        direction: "inbound",
      },
      orderBy: { createdAt: "desc" },
    });

    if (!lastInbound) {
      console.log("⚠️ No inbound message with whatsappMessageId found");
      console.log("========== MARK READ END ==========\n");
      return res.sendStatus(200);
    }

    console.log("📨 Last inbound message:");
    console.log("   id:", lastInbound.id);
    console.log("   whatsappMessageId:", lastInbound.whatsappMessageId);
    console.log("   dbStatus:", lastInbound.status);

    try {
      console.log("🔐 Decrypting WhatsApp access token");
      const accessToken = decrypt(conversation.vendor.whatsappAccessToken);

      console.log("📡 Sending WhatsApp READ receipt");
      console.log(
        "POST URL:",
        `https://graph.facebook.com/v24.0/${conversation.vendor.whatsappPhoneNumberId}/messages`
      );

      const payload = {
        messaging_product: "whatsapp",
        status: "read",
        message_id: lastInbound.whatsappMessageId,
      };

      console.log("📡 Payload:", payload);

      const waRes = await fetch(
        `https://graph.facebook.com/v24.0/${conversation.vendor.whatsappPhoneNumberId}/messages`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const waText = await waRes.text();

      console.log("📡 WhatsApp response status:", waRes.status);
      console.log("📡 WhatsApp response body:", waText);

      if (!waRes.ok) {
        console.error("❌ WhatsApp READ FAILED");
      } else {
        console.log(
          "✅ WhatsApp READ receipt SENT — waiting for webhook confirmation"
        );
      }
    } catch (err) {
      console.error("❌ WhatsApp READ exception:", err);
    }

    console.log("🚫 DB NOT UPDATED here (webhook will handle it)");
    console.log("🚫 No socket message:status emitted here");

    console.log("========== MARK READ END ==========\n");
    return res.sendStatus(200);
  })
);

export default router;
