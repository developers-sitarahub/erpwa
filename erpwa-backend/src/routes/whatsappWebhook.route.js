import express from "express";
import prisma from "../prisma.js";
import { getIO } from "../socket.js";

const router = express.Router();

/* ===============================
   WEBHOOK VERIFICATION (META)
=============================== */
router.get("/", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }

  return res.sendStatus(403);
});

/* ===============================
   WEBHOOK EVENT HANDLER
=============================== */
router.post("/", async (req, res) => {
  try {
    const entry = req.body.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;

    if (!value) return res.sendStatus(200);

    /* ===============================
       Resolve Vendor by phone_number_id
    =============================== */
    const phoneNumberId = value.metadata?.phone_number_id;
    if (!phoneNumberId) return res.sendStatus(200);

    const vendor = await prisma.vendor.findFirst({
      where: { whatsappPhoneNumberId: phoneNumberId },
    });

    if (!vendor) return res.sendStatus(200);

    const now = new Date();
    const sessionExpiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    /* =====================================================
       1️⃣ HANDLE INBOUND CUSTOMER MESSAGES
    ===================================================== */
    if (value.messages?.length) {
      for (const msg of value.messages) {
        const whatsappMessageId = msg.id;
        const from = msg.from;

        // 🔹 Deduplication
        const exists = await prisma.message.findFirst({
          where: { whatsappMessageId },
        });
        if (exists) continue;

        // 🔹 Find or create lead
        const lead = await prisma.lead.upsert({
          where: {
            vendorId_phoneNumber: {
              vendorId: vendor.id,
              phoneNumber: from,
            },
          },
          update: { lastContactedAt: now },
          create: {
            vendorId: vendor.id,
            phoneNumber: from,
            whatsappOptIn: true,
            optInSource: "inbound",
            optInAt: now,
          },
        });

        // 🔹 Find or create conversation
        const conversation = await prisma.conversation.upsert({
          where: {
            vendorId_leadId: {
              vendorId: vendor.id,
              leadId: lead.id,
            },
          },
          update: {
            lastMessageAt: now,
            isOpen: true,
            sessionExpiresAt,
          },
          create: {
            vendorId: vendor.id,
            leadId: lead.id,
            channel: "whatsapp",
            isOpen: true,
            sessionStartedAt: now,
            lastMessageAt: now,
            sessionExpiresAt,
          },
        });

        // 🔹 Extract message text
        let content = "";
        if (msg.type === "text") {
          content = msg.text.body;
        } else if (msg.type === "button") {
          content = msg.button.text;
        } else {
          content = `[${msg.type} message]`;
        }

        const replyToWhatsappMessageId = msg.context?.id ?? null;

        // 🔹 Store inbound message
        const inboundMessage = await prisma.message.create({
          data: {
            vendorId: vendor.id,
            conversationId: conversation.id,
            direction: "inbound",
            channel: "whatsapp",
            messageType: msg.type,
            content,
            whatsappMessageId,
            replyToMessageId: replyToWhatsappMessageId,
            status: "delivered",
            inboundPayload: msg,
          },
        });

        /* 🔥 EMIT INBOX UPDATE */
        try {
          const io = getIO();
          io.to(`vendor:${vendor.id}`).emit("inbox:update", {
            conversationId: conversation.id,
          });
        } catch {}

        /* 🔥 SAFE SOCKET EMIT (OPTIONAL) */
        try {
          const io = getIO();
          io.to(`conversation:${conversation.id}`).emit("message:new", {
            id: inboundMessage.id,
            whatsappMessageId: inboundMessage.whatsappMessageId,
            text: inboundMessage.content,
            sender: "customer",
            timestamp: inboundMessage.createdAt.toISOString(),
            status: "delivered",
            replyToMessageId: inboundMessage.replyToMessageId,
          });
        } catch {
          // socket not ready – ignore (webhook must never fail)
        }
      }
    }

    /* =====================================================
       2️⃣ HANDLE MESSAGE STATUS UPDATES
    ===================================================== */
    if (value.statuses?.length) {
      for (const status of value.statuses) {
        const whatsappMessageId = status.id;
        const newStatus = status.status;

        const updated = await prisma.message.updateMany({
          where: { whatsappMessageId },
          data: {
            status: newStatus,
            errorCode: status.errors?.[0]?.code?.toString() || null,
          },
        });

        if (!updated.count) continue;

        const message = await prisma.message.findFirst({
          where: { whatsappMessageId },
          select: { conversationId: true },
        });

        if (!message) continue;

        await prisma.conversation.update({
          where: { id: message.conversationId },
          data: { lastMessageAt: new Date() },
        });

        try {
          const io = getIO();
          io.to(`vendor:${vendor.id}`).emit("inbox:update", {
            conversationId: message.conversationId,
          });
        } catch {}

        /* 🔥 SAFE SOCKET STATUS EMIT */
        try {
          const io = getIO();
          io.to(`conversation:${message.conversationId}`).emit(
            "message:status",
            {
              whatsappMessageId,
              status: newStatus,
            }
          );
        } catch {
          // ignore socket failures
        }
      }
    }

    return res.sendStatus(200);
  } catch (err) {
    console.error("WhatsApp webhook error:", err);
    return res.sendStatus(200); // 👈 NEVER fail webhook
  }
});

// ===============================
// MARK INBOUND MESSAGES AS READ
// ===============================
router.post("/mark-read/:conversationId", async (req, res) => {
  try {
    const { conversationId } = req.params;

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        vendor: true,
        messages: {
          where: {
            direction: "inbound",
            status: { not: "read" },
            whatsappMessageId: { not: null },
          },
          orderBy: { createdAt: "desc" },
          take: 1, // 🔥 ONLY LATEST MESSAGE
        },
      },
    });

    if (!conversation || !conversation.vendor) {
      return res.sendStatus(404);
    }

    const accessToken = conversation.vendor.whatsappAccessToken;

    // 🔥 Mark each inbound message as read on WhatsApp
    await Promise.all(
      conversation.messages.map((msg) =>
        fetch(
          `https://graph.facebook.com/v19.0/${conversation.vendor.whatsappPhoneNumberId}/messages`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              messaging_product: "whatsapp",
              status: "read",
              message_id: msg.whatsappMessageId,
            }),
          }
        )
      )
    );

    const messageIds = conversation.messages.map((m) => m.id);

    await prisma.message.updateMany({
      where: { id: { in: messageIds } },
      data: { status: "read" },
    });

    // 🔥 Emit socket update
    const io = getIO();
    conversation.messages.forEach((msg) => {
      io.to(`conversation:${conversationId}`).emit("message:status", {
        whatsappMessageId: msg.whatsappMessageId,
        status: "read",
      });
    });

    return res.sendStatus(200);
  } catch (err) {
    console.error("Mark read failed:", err);
    return res.sendStatus(200);
  }
});

export default router;
