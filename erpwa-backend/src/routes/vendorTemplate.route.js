import express from "express";
import prisma from "../prisma.js";
import fetch from "node-fetch";
import { decrypt } from "../utils/encryption.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { requireRoles } from "../middleware/requireRole.middleware.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

const router = express.Router();

/**
 * ===============================
 * CREATE TEMPLATE (DRAFT)
 * ===============================
 */
router.post(
  "/",
  authenticate,
  requireRoles(["vendor_owner", "vendor_admin"]),
  asyncHandler(async (req, res) => {
    const {
      metaTemplateName,
      displayName,
      category,
      language,
      body,
      footerText,
      buttons = [],
    } = req.body;

    /* ===============================
       1️⃣ Basic validation
       =============================== */
    if (!metaTemplateName || !category || !language || !body) {
      return res.status(400).json({
        message: "metaTemplateName, category, language and body are required",
      });
    }

    if (buttons.length > 2) {
      return res.status(400).json({
        message: "WhatsApp allows a maximum of 2 buttons",
      });
    }

    /* ===============================
       2️⃣ Button validation (CRITICAL)
       =============================== */
    for (const [index, btn] of buttons.entries()) {
      if (!btn.type || !btn.text) {
        return res.status(400).json({
          message: `Button ${index + 1} must have type and text`,
        });
      }

      if (btn.type === "URL") {
        if (!btn.value) {
          return res.status(400).json({
            message: "URL button requires a value",
          });
        }

        // Meta rule: only {{1}} allowed and must be at the end
        if (/\{\{\d+\}\}/.test(btn.value) && !btn.value.endsWith("{{1}}")) {
          return res.status(400).json({
            message: "CTA URL can only contain {{1}} at the end",
            invalidUrl: btn.value,
          });
        }
      }

      if (btn.type === "QUICK_REPLY" && btn.value) {
        return res.status(400).json({
          message: "Quick reply buttons must not contain value",
        });
      }
    }

    /* ===============================
       3️⃣ Transaction-safe creation
       =============================== */
    const result = await prisma.$transaction(async (tx) => {
      // Create template
      const template = await tx.template.create({
        data: {
          vendorId: req.user.vendorId,
          metaTemplateName,
          displayName,
          category,
          status: "draft",
        },
      });

      // Create language
      const templateLanguage = await tx.templateLanguage.create({
        data: {
          templateId: template.id,
          language,
          body,
          footerText,
          metaStatus: "draft",
        },
      });

      // Create buttons
      for (let i = 0; i < buttons.length; i++) {
        const btn = buttons[i];

        await tx.templateButton.create({
          data: {
            type: btn.type,
            text: btn.text,
            position: i,

            // 🔑 THIS IS THE KEY FIX
            value:
              btn.type === "URL" || btn.type === "PHONE" ? btn.value : null,

            template: {
              connect: { id: template.id },
            },
          },
        });
      }

      return template;
    });

    /* ===============================
       4️⃣ Success response
       =============================== */
    res.status(201).json({
      success: true,
      template: {
        id: result.id,
        metaTemplateName: result.metaTemplateName,
        status: result.status,
      },
    });
  })
);

/**
 * ===============================
 * SUBMIT TEMPLATE TO META
 * ===============================
 */
router.post(
  "/:id/submit",
  authenticate,
  requireRoles(["vendor_owner"]),
  asyncHandler(async (req, res) => {
    const template = await prisma.template.findUnique({
      where: { id: req.params.id },
      include: {
        vendor: true,
        languages: true,
        buttons: true,
      },
    });

    if (!template) {
      return res.status(404).json({ message: "Template not found" });
    }

    if (template.status !== "draft") {
      return res
        .status(400)
        .json({ message: "Only draft templates can be submitted" });
    }

    const language = template.languages[0];
    if (!language) {
      return res.status(400).json({ message: "Template language missing" });
    }

    const accessToken = decrypt(template.vendor.whatsappAccessToken);

    // Build Meta components
    const components = [
      {
        type: "BODY",
        text: language.body,
      },
    ];

    if (language.footerText) {
      components.push({
        type: "FOOTER",
        text: language.footerText,
      });
    }

    if (template.buttons.length) {
      components.push({
        type: "BUTTONS",
        buttons: template.buttons.map((b) => ({
          type: b.type,
          text: b.text,
          ...(b.type === "URL" && { url: b.value }),
          ...(b.type === "PHONE" && { phone_number: b.value }),
        })),
      });
    }

    const metaResp = await fetch(
      `https://graph.facebook.com/v19.0/${template.vendor.whatsappBusinessId}/message_templates`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: template.metaTemplateName,
          category: template.category,
          language: language.language,
          components,
        }),
      }
    );

    const metaData = await metaResp.json();

    if (!metaResp.ok) {
      const reason =
        metaData?.error?.error_user_msg ||
        metaData?.error?.message ||
        "Meta rejected the template at submission";

      await prisma.templateLanguage.update({
        where: { id: language.id },
        data: {
          metaStatus: "rejected",
          metaReason: reason,
        },
      });

      await prisma.template.update({
        where: { id: template.id },
        data: { status: "rejected" },
      });

      return res.status(400).json({
        message: "Meta template submission failed",
        metaReason: reason,
      });
    }

    await prisma.templateLanguage.update({
      where: { id: language.id },
      data: {
        metaId: metaData.id,
        metaStatus: "pending",
      },
    });

    await prisma.template.update({
      where: { id: template.id },
      data: { status: "pending" },
    });

    res.json({
      message: "Template submitted to Meta",
      metaTemplateId: metaData.id,
      status: "pending",
    });
  })
);

/**
 * ===============================
 * GET ALL VENDOR TEMPLATES
 * ===============================
 */
router.get(
  "/",
  authenticate,
  requireRoles(["vendor_owner"]),
  asyncHandler(async (req, res) => {
    const templates = await prisma.template.findMany({
      where: { vendorId: req.user.vendorId },
    });
    res.json(templates);
  })
);

export default router;
