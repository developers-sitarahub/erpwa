import express from "express";
import fetch from "node-fetch";
import prisma from "../prisma.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { requireRoles } from "../middleware/requireRole.middleware.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { decrypt } from "../utils/encryption.js";

const router = express.Router();

router.post(
  "/send-template",
  authenticate,
  requireRoles(["vendor_owner", "vendor_admin", "sales"]),
  asyncHandler(async (req, res) => {
    const {
      recipients = [],
      templateId,
      bodyVariables = [],
      buttonVariables = [],
    } = req.body;

    if (!recipients.length || !templateId) {
      return res.status(400).json({ message: "Invalid request" });
    }

    /** 1️⃣ Vendor */
    const vendor = await prisma.vendor.findUnique({
      where: { id: req.user.vendorId },
    });

    if (!vendor?.whatsappPhoneNumberId || !vendor?.whatsappAccessToken) {
      return res.status(400).json({ message: "WhatsApp not configured" });
    }

    const accessToken = decrypt(vendor.whatsappAccessToken);

    /** 2️⃣ Template */
    const template = await prisma.template.findFirst({
      where: { id: templateId, status: "approved" },
      include: {
        languages: {
          where: { metaStatus: "approved" },
          take: 1,
        },
      },
    });

    if (!template || !template.languages.length) {
      return res.status(404).json({ message: "Approved template not found" });
    }

    const language = template.languages[0];

    /** 3️⃣ Load header media (if any) */
    let media = null;

    if (language.headerType && language.headerType !== "TEXT") {
      media = await prisma.templateMedia.findFirst({
        where: {
          templateId: template.id,
          language: language.language,
        },
      });

      if (!media?.s3Url) {
        return res.status(400).json({
          message:
            "Template media URL not found. Please re-upload the template.",
        });
      }
    }

    const results = [];

    /** 4️⃣ Send to recipients */
    for (const to of recipients) {
      try {
        const components = [];

        /** 🔹 HEADER (MEDIA ONLY) */
        if (media) {
          // Use the S3 URL (link) for sending - NOT the resumable upload handle
          // The whatsappMediaId from template creation is a resumable upload handle,
          // which is not valid for sending messages. We use the public S3 URL instead.
          components.push({
            type: "header",
            parameters: [
              {
                type: media.mediaType, // image | video | document
                [media.mediaType]: {
                  link: media.s3Url, // ✅ Use public URL instead of ID
                },
              },
            ],
          });
        }

        /** 🔹 BODY */
        if (bodyVariables.length) {
          components.push({
            type: "body",
            parameters: bodyVariables.map((v) => ({
              type: "text",
              text: String(v),
            })),
          });
        }

        /** 🔹 BUTTONS (URL buttons only) */
        buttonVariables.forEach((v, index) => {
          components.push({
            type: "button",
            sub_type: "url",
            index: String(index),
            parameters: [{ type: "text", text: String(v) }],
          });
        });

        /** 🔹 SEND TO WHATSAPP */
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
                language: { code: language.language },
                components,
              },
            }),
          }
        );

        const metaData = await metaResp.json();
        if (!metaResp.ok) throw metaData;

        results.push({ to, success: true });
      } catch (err) {
        results.push({
          to,
          success: false,
          error: err?.error?.message || err,
        });
      }
    }

    res.json({ success: true, results });
  })
);

export default router;
