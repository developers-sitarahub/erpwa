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

    // Get vendor's current phone number to scope inbox
    const vendor = await prisma.vendor.findUnique({
      where: { id: vendorId },
      select: { whatsappPhoneNumberId: true },
    });

    const phoneNumberId = vendor?.whatsappPhoneNumberId;

    if (!phoneNumberId) {
      return res.json([]); // No phone configured → empty inbox
    }

    const where = {
      vendorId,
      channel: "whatsapp",
      // Only conversations that have at least one message for this phone number
      messages: {
        some: { whatsappPhoneNumberId: phoneNumberId },
      },
    };

    // 🔒 ROLE-BASED FILTERING: Sales persons only see their assigned leads
    if (req.user.role === "sales") {
      where.lead = {
        salesPersonId: req.user.id,
      };
    }

    const conversations = await prisma.conversation.findMany({
      where,
      include: {
        lead: {
          select: {
            id: true,
            phoneNumber: true,
            companyName: true,
            status: true,
          },
        },
        messages: {
          where: { whatsappPhoneNumberId: phoneNumberId },
          orderBy: { createdAt: "desc" },
          take: 1, // last message preview
        },
      },
      orderBy: {
        lastMessageAt: "desc",
      },
    });

    // ✅ Fetch unread counts scoped to current phone number
    const unreadCounts = await prisma.message.groupBy({
      by: ["conversationId"],
      where: {
        conversationId: { in: conversations.map((c) => c.id) },
        whatsappPhoneNumberId: phoneNumberId,
        direction: "inbound",
        status: { not: "read" },
      },
      _count: {
        id: true,
      },
    });

    // Create a lookup map for O(1) access
    const unreadMap = new Map(
      unreadCounts.map((item) => [item.conversationId, item._count.id]),
    );

    // Attach unread counts without additional queries
    const conversationsWithUnread = conversations.map((conv) => ({
      ...conv,
      unreadCount: unreadMap.get(conv.id) || 0,
    }));

    res.json(conversationsWithUnread);
  }),
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

    // Get vendor's current phone number to scope messages
    const vendor = await prisma.vendor.findUnique({
      where: { id: vendorId },
      select: { whatsappPhoneNumberId: true },
    });

    const phoneNumberId = vendor?.whatsappPhoneNumberId;

    const where = {
      id: conversationId,
      vendorId,
      channel: "whatsapp",
    };

    // 1️⃣ Fetch conversation WITHOUT role restrictions first
    const conversation = await prisma.conversation.findFirst({
      where,
      include: {
        lead: {
          select: {
            id: true,
            phoneNumber: true,
            companyName: true,
            salesPersonId: true, // ✅ Ensure we select this for checking
            status: true,
          },
        },
        messages: {
          // Filter messages by current phone number ID
          where: phoneNumberId ? { whatsappPhoneNumberId: phoneNumberId } : {},
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

    // 2️⃣ Manually validate Sales permissions
    if (req.user.role === "sales") {
      const assignedId = conversation.lead?.salesPersonId;
      const userId = req.user.id;

      if (assignedId !== userId) {
        console.warn(
          `⛔ ACCESS DENIED: Sales user ${userId} tried to access lead assigned to ${assignedId}`,
        );
        return res.status(403).json({
          message:
            "You do not have permission to view this conversation (Lead not assigned to you).",
        });
      }
    }

    // 24-hour session check (ONLY for sending logic)
    const now = Date.now();

    const sessionStarted = !!conversation.sessionStartedAt;
    const sessionActive =
      !!conversation.sessionExpiresAt &&
      conversation.sessionExpiresAt.getTime() > now;

    // ✅ ENRICH: Fetch template details for template messages
    const templateIds = new Set();
    conversation.messages.forEach((m) => {
      if (m.messageType === "template" && m.outboundPayload?.templateId) {
        templateIds.add(m.outboundPayload.templateId);
      }
    });

    let templatesMap = new Map();
    if (templateIds.size > 0) {
      const templates = await prisma.template.findMany({
        where: { id: { in: Array.from(templateIds) } },
        include: {
          languages: true,
          buttons: true,
          media: true,
          carouselCards: { orderBy: { position: "asc" } },
          catalogProducts: { orderBy: { position: "asc" } }, // ✅ Include catalog products
        },
      });
      templates.forEach((t) => templatesMap.set(t.id, t));
    }

    // Map messages to include template details in outboundPayload
    const enrichedMessages = conversation.messages.map((m) => {
      if (m.messageType !== "template" || !m.outboundPayload?.templateId) {
        return m;
      }

      const tmpl = templatesMap.get(m.outboundPayload.templateId);
      if (!tmpl) return m;

      const langCode = m.outboundPayload.language || "en_US";
      const tmplLang =
        tmpl.languages.find((l) => l.language === langCode) ||
        tmpl.languages[0];

      // Resolve Header
      let header = null;
      if (tmplLang?.headerType && tmplLang.headerType !== "NONE") {
        if (tmplLang.headerType === "TEXT") {
          header = {
            type: "TEXT",
            text: tmplLang.headerText,
          };
        } else {
          // Media Header (Image, Video, Document)
          const media =
            tmpl.media.find((med) => med.language === langCode) ||
            tmpl.media[0];

          if (media) {
            header = {
              type: tmplLang.headerType, // IMAGE, VIDEO, DOCUMENT
              mediaUrl: media.s3Url,
            };
          }
        }
      }

      // Resolve Body
      let bodyText = tmplLang.body || "";
      if (
        m.outboundPayload.bodyVariables &&
        Array.isArray(m.outboundPayload.bodyVariables)
      ) {
        m.outboundPayload.bodyVariables.forEach((val, idx) => {
          bodyText = bodyText.replace(`{{${idx + 1}}}`, val);
        });
      }

      const templateObj = {
        header, // ✅ Added Header
        body: {
          type: "TEXT",
          text: bodyText,
        },
        footer: tmplLang?.footerText || null,
        buttons: tmpl.buttons.map((b) => ({
          type: b.type,
          text: b.text,
          value: b.value,
        })),
        templateType: tmpl.templateType || "standard",
        carouselCards: tmpl.carouselCards,
        catalogProducts: tmpl.catalogProducts, // ✅ Add Catalog Products
      };

      return {
        ...m,
        template: templateObj, // 🚀 LIFT TO TOP LEVEL for frontend convenience
        outboundPayload: {
          ...m.outboundPayload,
          template: templateObj,
        },
      };
    });

    // Also expose outboundPayload for non-template messages if present
    const finalMessages = enrichedMessages.map((m) => {
      if (m.messageType !== "template" && m.outboundPayload) {
        return {
          ...m,
          outboundPayload: m.outboundPayload,
        };
      }
      return m;
    });

    // DEBUG: Check for interactive messages
    const interactiveMsgs = finalMessages.filter(
      (m) => m.messageType === "interactive",
    );
    if (interactiveMsgs.length > 0) {
      console.log(
        "🔍 [InboxAPI] Found interactive messages:",
        interactiveMsgs.length,
      );
      console.log(
        "🔍 [InboxAPI] Sample payload:",
        JSON.stringify(interactiveMsgs[0].outboundPayload, null, 2),
      );
    } else {
      console.log(
        "🔍 [InboxAPI] No interactive messages found in conversation",
      );
    }

    res.json({
      conversationId: conversation.id,
      lead: conversation.lead,
      sessionStarted,
      sessionActive,
      sessionExpiresAt: conversation.sessionExpiresAt,
      messages: finalMessages,
    });
  }),
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

    const where = { id: conversationId, vendorId, channel: "whatsapp" };

    // 🔒 ROLE-BASED FILTERING: Sales persons only see their assigned leads
    if (req.user.role === "sales") {
      where.lead = {
        salesPersonId: req.user.id,
      };
    }

    console.log("🔍 Fetching conversation + vendor");

    const conversation = await prisma.conversation.findFirst({
      where,
      include: { vendor: true },
    });

    console.log(
      "📦 Conversation query result:",
      conversation ? "FOUND" : "NOT FOUND",
    );

    if (!conversation || !conversation.vendor) {
      console.error("❌ Conversation or vendor missing");
      console.log("========== MARK READ END ==========\n");
      return res.sendStatus(404);
    }

    console.log("✅ Conversation + vendor OK");
    console.log(
      "vendor.whatsappPhoneNumberId:",
      conversation.vendor.whatsappPhoneNumberId,
    );

    console.log(
      "🔍 Fetching latest inbound message (NOT trusting DB read state)",
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
        `https://graph.facebook.com/v24.0/${conversation.vendor.whatsappPhoneNumberId}/messages`,
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
        },
      );

      const waText = await waRes.text();

      console.log("📡 WhatsApp response status:", waRes.status);
      console.log("📡 WhatsApp response body:", waText);

      if (!waRes.ok) {
        console.error("❌ WhatsApp READ FAILED");
      } else {
        console.log(
          "✅ WhatsApp READ receipt SENT — waiting for webhook confirmation",
        );
      }
    } catch (err) {
      console.error("❌ WhatsApp READ exception:", err);
    }

    console.log("🚫 DB NOT UPDATED here (webhook will handle it)");
    console.log("🚫 No socket message:status emitted here");

    console.log("========== MARK READ END ==========\n");
    return res.sendStatus(200);
  }),
);

/**
 * ===============================
 * DELETE A MESSAGE COMPLETELY (DELETE FOR ME)
 * ===============================
 * Removes the message from the database completely without leaving a trace
 */
router.delete(
  "/messages/:messageId",
  authenticate,
  asyncHandler(async (req, res) => {
    const { messageId } = req.params;
    const vendorId = req.user.vendorId;

    // Find the message and verify ownership
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      select: { id: true, whatsappMessageId: true, vendorId: true, conversationId: true },
    });

    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    if (message.vendorId !== vendorId) {
      return res.status(403).json({ message: "Unauthorized to delete this message" });
    }

    // Role-based filtering: Sales persons can only access assigned leads
    if (req.user.role === "sales") {
      const conversation = await prisma.conversation.findUnique({
        where: { id: message.conversationId },
        include: { lead: true },
      });
      if (conversation?.lead?.salesPersonId && conversation.lead.salesPersonId !== req.user.id) {
        return res.status(403).json({ message: "Unauthorized to delete this message" });
      }
    }

    // Hard delete the message completely
    await prisma.$transaction(async (tx) => {
      // 1. Delete associated ActivityLogs if any exist
      const messageIdFilters = [message.id];
      if (message.whatsappMessageId) {
        messageIdFilters.push(message.whatsappMessageId);
      }

      await tx.activityLog.deleteMany({
        where: {
          messageId: { in: messageIdFilters },
        },
      });

      // 2. Delete the message itself (MessageMedia & MessageDelivery cascade deletes)
      await tx.message.delete({
        where: { id: messageId },
      });
    });

    // Emit socket event to notify clients that a message was deleted in real time
    try {
      const io = getIO();
      io.to(`conversation:${message.conversationId}`).emit("message:deleted", {
        messageId,
        conversationId: message.conversationId,
      });

      // Also update the inbox list preview
      io.to(`vendor:${vendorId}`).emit("inbox:update", {
        conversationId: message.conversationId,
      });
    } catch (err) {
      console.error("Socket error emitting message:deleted:", err);
    }

    res.json({ success: true, message: "Message deleted completely" });
  })
);

export default router;

