import express from "express";
import fetch from "node-fetch";
import prisma from "../prisma.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { requireRoles } from "../middleware/requireRole.middleware.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { decrypt } from "../utils/encryption.js";

const router = express.Router();

/**
 * =====================================================
 * SEND APPROVED WHATSAPP TEMPLATE (BODY + BUTTON VARS)
 * =====================================================
 */
router.post(
  "/send-template",
  authenticate,
  requireRoles(["vendor_owner", "vendor_admin", "sales"]),
  asyncHandler(async (req, res) => {
    // ... existing send-template logic ...
  })
);

router.post(
  "/send-bulk-template",
  authenticate,
  requireRoles(["vendor_owner", "vendor_admin", "sales"]),
  asyncHandler(async (req, res) => {
    const { templateId, recipients } = req.body;

    /* ===============================
       0️⃣ Validation
       =============================== */
    if (!templateId || !Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({
        message: "`templateId` and `recipients` array are required",
      });
    }

    /* ===============================
       1️⃣ Vendor WhatsApp config
       =============================== */
    const vendor = await prisma.vendor.findUnique({
      where: { id: req.user.vendorId },
    });

    if (!vendor?.whatsappAccessToken || !vendor.whatsappPhoneNumberId) {
      return res.status(400).json({
        message: "WhatsApp not configured for vendor",
      });
    }

    const accessToken = decrypt(vendor.whatsappAccessToken);

    /* ===============================
       2️⃣ Approved template + language
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
        message: "Template not approved or not found",
      });
    }

    const language = template.languages[0];

    const bodyText = language.body || "";
    const expectedBodyVars =
      (bodyText.match(/\{\{\d+\}\}/g) || []).length;

    const results = [];

    for (const recipient of recipients) {
      const { leadId, bodyVariables = [], buttonVariables = [] } = recipient;

      if (!leadId) {
        results.push({ leadId, status: "failed", reason: "Missing leadId" });
        continue;
      }

      const lead = await prisma.lead.findUnique({
        where: { id: leadId, vendorId: vendor.id },
      });

      if (!lead || !lead.phoneNumber) {
        results.push({ leadId, status: "failed", reason: "Lead not found or missing phone number" });
        continue;
      }

      if (expectedBodyVars !== bodyVariables.length) {
        results.push({
          leadId,
          status: "failed",
          reason: `Template expects ${expectedBodyVars} body variables, received ${bodyVariables.length}`,
        });
        continue;
      }

      const now = new Date();
      await prisma.lead.update({
        where: { id: lead.id },
        data: { lastContactedAt: now },
      });

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
        },
        create: {
          vendorId: vendor.id,
          leadId: lead.id,
          channel: "whatsapp",
          sessionStartedAt: now,
          lastMessageAt: now,
          isOpen: true,
        },
      });

      const components = [];

      if (bodyVariables.length > 0) {
        components.push({
          type: "body",
          parameters: bodyVariables.map((v) => ({
            type: "text",
            text: String(v),
          })),
        });
      }

      buttonVariables.forEach((v, index) => {
        components.push({
          type: "button",
          sub_type: "url",
          index: String(index),
          parameters: [
            {
              type: "text",
              text: String(v),
            },
          ],
        });
      });

      try {
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
              to: lead.phoneNumber,
              type: "template",
              template: {
                name: template.metaTemplateName,
                language: { code: language.language },
                components,
              },
            }),
          }
        );

        const metaData = await metaResp.json();

        if (!metaResp.ok) {
          throw new Error(metaData?.error?.message || "Failed to send to Meta");
        }

        const message = await prisma.message.create({
          data: {
            vendorId: vendor.id,
            conversationId: conversation.id,
            direction: "outbound",
            channel: "whatsapp",
            messageType: "template",
            content: template.displayName,
            whatsappMessageId: metaData.messages?.[0]?.id || null,
            status: "sent",
            outboundPayload: metaData,
          },
        });

        results.push({
          leadId,
          status: "sent",
          messageId: message.id,
          whatsappMessageId: metaData.messages?.[0]?.id,
        });
      } catch (metaErr) {
        console.error(`Error sending to Meta for lead ${lead.id}:`, metaErr);
        results.push({
          leadId,
          status: "failed",
          reason: metaErr.message || "Meta API error",
        });
      }
    }

    res.json({ success: true, results });
  })
);

export default router;
