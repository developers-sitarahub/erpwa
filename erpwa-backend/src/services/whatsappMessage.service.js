import axios from "axios";
import prisma from "../prisma.js";
import { decrypt } from "../utils/encryption.js";

/**
 * Validates and sends a WhatsApp message via Cloud API,
 * then logs it to the database so it appears in chat history.
 *
 * @param {string} vendorId
 * @param {string} conversationId
 * @param {object} contentObj  { type: 'text'|'image'|'interactive', text?, image?, interactive? }
 */
export async function sendMessage(vendorId, conversationId, contentObj) {
  try {
    // 1. Fetch Context (Vendor & Conversation)
    const vendor = await prisma.vendor.findUnique({
      where: { id: vendorId },
    });
    if (
      !vendor ||
      !vendor.whatsappAccessToken ||
      !vendor.whatsappPhoneNumberId
    ) {
      throw new Error("Vendor missing WhatsApp credentials");
    }

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { lead: true },
    });

    if (!conversation || !conversation.lead?.phoneNumber) {
      throw new Error("Conversation or lead phone number not found");
    }

    const accessToken = decrypt(vendor.whatsappAccessToken);
    const phoneNumberId = vendor.whatsappPhoneNumberId;
    const to = conversation.lead.phoneNumber;

    // 2. Construct Payload
    const url = `https://graph.facebook.com/v24.0/${phoneNumberId}/messages`;

    let whatsappPayload = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: to,
      type: contentObj.type,
    };

    let bodyText = ""; // For DB logging

    switch (contentObj.type) {
      case "text":
        whatsappPayload.text = { body: contentObj.text };
        bodyText = contentObj.text;
        break;

      case "image":
        whatsappPayload.image = contentObj.image; // { link: '...' }
        bodyText = contentObj.image.caption || "[Image]";
        break;

      case "interactive":
        whatsappPayload.interactive = contentObj.interactive;
        // Try to extract a readable text for DB
        bodyText = contentObj.interactive.body?.text || "[Interactive Message]";
        break;

      default:
        throw new Error(`Unsupported message type: ${contentObj.type}`);
    }

    // 3. Send to WhatsApp
    const res = await axios.post(url, whatsappPayload, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    // 4. Log to Database (Message Table)
    const waMessageId = res.data.messages?.[0]?.id;

    if (waMessageId) {
      await prisma.message.create({
        data: {
          vendorId,
          conversationId,
          direction: "outbound",
          channel: "whatsapp",
          messageType: contentObj.type,
          content: bodyText,
          whatsappMessageId: waMessageId,
          status: "sent",
        },
      });
    }

    return res.data;
  } catch (error) {
    console.error(
      "❌ sendMessage Error:",
      error.response?.data || error.message,
    );
    throw error; // Rethrow to let caller handle flow error
  }
}
