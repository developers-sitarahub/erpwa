import prisma from "../prisma.js";
import { sendWhatsAppImage } from "../services/whatsappCampaign.service.js";
import { decrypt } from "../utils/encryption.js";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const MAX_RETRIES = 2;
const SEND_DELAY = 1200;

function log(level, message, meta = {}) {
  console.log(
    JSON.stringify({
      ts: new Date().toISOString(),
      level,
      message,
      ...meta,
    })
  );
}

export async function processImageQueue() {
  log("info", "WhatsApp Image Worker started");

  while (true) {
    const message = await prisma.message.findFirst({
      where: {
        status: "queued",
        messageType: "image",
        retryCount: { lt: MAX_RETRIES },
      },
      orderBy: { createdAt: "asc" },
      include: {
        vendor: true,
        conversation: { include: { lead: true } },
        media: { include: { deliveries: true } },
      },
    });

    if (!message) {
      await sleep(2000);
      continue;
    }

    const locked = await prisma.message.updateMany({
      where: { id: message.id, status: "queued" },
      data: { status: "processing" },
    });

    if (locked.count === 0) continue;

    const media = message.media[0];
    const delivery = media?.deliveries?.[0];

    try {
      if (!media) throw new Error("Media not found");
      if (!delivery) throw new Error("Delivery record missing");

      const vendor = message.vendor;

      if (!vendor.whatsappPhoneNumberId || !vendor.whatsappAccessToken) {
        throw new Error("WhatsApp not configured for vendor");
      }

      // 🔐 DECRYPT TOKEN (CRITICAL)
      const accessToken = decrypt(vendor.whatsappAccessToken);

      const raw = message.conversation.lead.phoneNumber.replace(/\D/g, "");
      const to = raw.startsWith("91") ? raw : `91${raw}`;

      log("info", "Sending WhatsApp image", {
        messageId: message.id,
        to,
        mediaUrl: media.mediaUrl,
      });

      const result = await sendWhatsAppImage({
        phoneNumberId: vendor.whatsappPhoneNumberId,
        accessToken,
        to,
        imageUrl: media.mediaUrl,
        caption: media.caption,
      });

      const whatsappMsgId = result.messages?.[0]?.id;

      await prisma.$transaction([
        prisma.message.update({
          where: { id: message.id },
          data: { status: "sent" },
        }),
        prisma.messageDelivery.update({
          where: { id: delivery.id },
          data: {
            status: "sent",
            whatsappMsgId,
          },
        }),
      ]);

      log("success", "Image sent successfully", {
        messageId: message.id,
        whatsappMsgId,
      });

      await sleep(SEND_DELAY);
    } catch (err) {
      const retries = message.retryCount + 1;
      const metaError = err.response?.data?.error;

      log("error", "WhatsApp send failed", {
        messageId: message.id,
        attempt: retries,
        httpStatus: err.response?.status,
        metaCode: metaError?.code,
        metaMessage: metaError?.message,
      });

      // 🔴 Token invalid → disable vendor
      if (metaError?.code === 190) {
        await prisma.vendor.update({
          where: { id: message.vendorId },
          data: {
            whatsappStatus: "error",
            whatsappLastError: metaError.message,
          },
        });
      }

      await prisma.$transaction([
        prisma.message.update({
          where: { id: message.id },
          data: {
            retryCount: retries,
            status: retries >= MAX_RETRIES ? "failed" : "queued",
            errorCode: metaError?.code?.toString() || err.message,
          },
        }),
        prisma.messageDelivery.updateMany({
          where: { messageId: message.id },
          data: {
            status: retries >= MAX_RETRIES ? "failed" : "queued",
            error: metaError?.message || err.message,
          },
        }),
      ]);

      await sleep(3000);
    }
  }
}
