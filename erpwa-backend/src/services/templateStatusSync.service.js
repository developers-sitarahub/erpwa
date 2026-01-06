import fetch from "node-fetch";
import prisma from "../prisma.js";
import { decrypt } from "../utils/encryption.js";

export async function syncTemplateStatuses() {
  const pendingTemplates = await prisma.templateLanguage.findMany({
    where: { metaStatus: "pending", metaId: { not: null } },
    include: {
      template: {
        include: { vendor: true },
      },
    },
  });

  if (!pendingTemplates.length) return;

  // Group by vendor (important to reduce API calls)
  const vendorMap = new Map();

  for (const t of pendingTemplates) {
    if (!vendorMap.has(t.template.vendorId)) {
      vendorMap.set(t.template.vendorId, {
        vendor: t.template.vendor,
        templates: [],
      });
    }
    vendorMap.get(t.template.vendorId).templates.push(t);
  }

  for (const { vendor, templates } of vendorMap.values()) {
    if (!vendor.whatsappAccessToken || !vendor.whatsappBusinessId) continue;

    const token = decrypt(vendor.whatsappAccessToken);

    const resp = await fetch(
      `https://graph.facebook.com/v24.0/${vendor.whatsappBusinessId}/message_templates`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (!resp.ok) continue;

    const data = await resp.json();

    for (const tpl of templates) {
      const metaTpl = data.data.find(m => m.id === tpl.metaId);
      if (!metaTpl) continue;

      if (metaTpl.status !== tpl.metaStatus) {
        await prisma.templateLanguage.update({
          where: { id: tpl.id },
          data: {
            metaStatus: metaTpl.status.toLowerCase(),
            metaReason: metaTpl.rejected_reason || null,
          },
        });

        // Optional: update parent template status
        await prisma.template.update({
          where: { id: tpl.templateId },
          data: {
            status: metaTpl.status.toLowerCase(),
          },
        });
      }
    }
  }
}
