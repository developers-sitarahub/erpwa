import cron from "node-cron";
import { syncTemplateStatuses } from "../services/templateStatusSync.service.js";
import prisma from "../prisma.js";

/**
 * Runs every 15 minutes
 * Syncs WhatsApp template approval statuses
 */
cron.schedule(
  "*/15 * * * *", // ✅ every 15 minutes
  async () => {
    const pendingCount = await prisma.templateLanguage.count({
      where: {
        metaStatus: "pending",
        metaId: { not: null },
      },
    });

    if (pendingCount === 0) return; // 🔇 NO LOG SPAM

    console.log(`🔄 Syncing ${pendingCount} WhatsApp template(s)...`);
    await syncTemplateStatuses();
  },
  {
    scheduled: true,
    recoverMissedExecutions: false, // ✅ CRITICAL
  }
);
