import express from "express";
import prisma from "../prisma.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

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
        id: conversationId,
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
          orderBy: {
            createdAt: "asc",
          },
          select: {
            id: true,
            content: true,
            direction: true,
            status: true,
            createdAt: true,
            whatsappMessageId: true, // ✅ REQUIRED
            replyToMessageId: true, // ✅ REQUIRED
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

export default router;
