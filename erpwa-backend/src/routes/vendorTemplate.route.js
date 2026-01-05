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
  requireRoles(["vendor_owner"]),
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

    if (!metaTemplateName || !category || !language || !body) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    if (buttons.length > 2) {
      return res.status(400).json({ message: "Max 2 buttons allowed" });
    }

    const template = await prisma.template.create({
      data: {
        vendorId: req.user.vendorId,
        metaTemplateName,
        displayName,
        category,
        status: "draft",
      },
    });

    const templateLanguage = await prisma.templateLanguage.create({
      data: {
        templateId: template.id,
        language,
        body,
        footerText,
        metaStatus: "draft",
      },
    });

    for (let i = 0; i < buttons.length; i++) {
      const btn = buttons[i];

      await prisma.templateButton.create({
        data: {
          templateId: template.id,
          type: btn.type,
          text: btn.text,
          position: i,
          value:
            btn.type === "URL" || btn.type === "PHONE_NUMBER"
              ? btn.value
              : null,
        },
      });
    }

    res.json({ template, language: templateLanguage });
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

    /**
     * ===============================
     * CTA URL VALIDATION (META RULE)
     * ===============================
     */
    for (const b of template.buttons) {
      if (b.type !== "URL") continue;

      const vars = b.value?.match(/\{\{\d+\}\}/g) || [];

      if (vars.length === 0) continue;
      if (vars.length === 1 && b.value.endsWith("{{1}}")) continue;

      return res.status(400).json({
        message: "CTA URL can only contain {{1}} at the end",
        invalidUrl: b.value,
      });
    }

    const accessToken = decrypt(template.vendor.whatsappAccessToken);

    /**
     * ===============================
     * VARIABLE HANDLING (CRITICAL)
     * ===============================
     */
    const bodyVars = language.body.match(/\{\{\d+\}\}/g) || [];
    const bodyVarCount = bodyVars.length;

    const bodyComponent = {
      type: "BODY",
      text: language.body,
    };

    // ✅ REQUIRED BY META WHEN VARIABLES EXIST
    if (bodyVarCount > 0) {
      bodyComponent.example = {
        body_text: [
          Array.from({ length: bodyVarCount }).map(
            (_, i) => `Example ${i + 1}`
          ),
        ],
      };
    }

    const components = [bodyComponent];

    if (language.footerText) {
      components.push({
        type: "FOOTER",
        text: language.footerText,
      });
    }

    if (template.buttons.length > 0) {
      components.push({
        type: "BUTTONS",
        buttons: template.buttons.map((b) => {
          if (b.type === "URL") {
            const hasVar = /\{\{\d+\}\}/.test(b.value);

            return {
              type: "URL",
              text: b.text,
              url: b.value,
              ...(hasVar && {
                example: ["TRACK123"],
              }),
            };
          }

          if (b.type === "PHONE_NUMBER") {
            return {
              type: "PHONE_NUMBER",
              text: b.text,
              phone_number: b.value,
            };
          }

          return {
            type: "QUICK_REPLY",
            text: b.text,
          };
        }),
      });
    }

    /**
     * ===============================
     * SUBMIT TO META
     * ===============================
     */
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
        "Template rejected by Meta";

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

      return res.status(400).json({ message: reason });
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
      message: "Template submitted successfully",
      metaTemplateId: metaData.id,
    });
  })
);

/**
 * ===============================
 * LIST TEMPLATES
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
