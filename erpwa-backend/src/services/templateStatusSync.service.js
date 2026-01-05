import fetch from "node-fetch";
import prisma from "../prisma.js";
import { decrypt } from "../utils/encryption.js";

export async function syncTemplateStatuses() {
  const pendingTemplates = await prisma.templateLanguage.findMany({
    where: {
      metaStatus: "pending",
      metaId: { not: null },
    },
    include: {
      template: {
        include: { vendor: true },
      },
    },
  });

  if (!pendingTemplates.length) return;

  // Group by vendor to reduce API calls
  const vendorMap = new Map();

  for (const tpl of pendingTemplates) {
    if (!vendorMap.has(tpl.template.vendorId)) {
      vendorMap.set(tpl.template.vendorId, {
        vendor: tpl.template.vendor,
        templates: [],
      });
    }
    vendorMap.get(tpl.template.vendorId).templates.push(tpl);
  }

  for (const { vendor, templates } of vendorMap.values()) {
    if (!vendor.whatsappAccessToken || !vendor.whatsappBusinessId) continue;

    const token = decrypt(vendor.whatsappAccessToken);

    const resp = await fetch(
      `https://graph.facebook.com/v24.0/${vendor.whatsappBusinessId}/message_templates`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!resp.ok) continue;

    const data = await resp.json();

    for (const tpl of templates) {
      const metaTpl = data.data.find((m) => m.id === tpl.metaId);
      if (!metaTpl) continue;

      const newStatus = metaTpl.status.toLowerCase();

      // Skip if no status change
      if (newStatus === tpl.metaStatus) continue;

      await prisma.templateLanguage.update({
        where: { id: tpl.id },
        data: {
          metaStatus: newStatus,

          // ✅ DO NOT overwrite existing reason with null
          metaReason:
            metaTpl.rejected_reason ??
            tpl.metaReason ??
            null,
        },
      });

      // Keep parent template status in sync
      await prisma.template.update({
        where: { id: tpl.templateId },
        data: {
          status: newStatus,
        },
      });
    }
  }
}
