/**
 * WhatsApp Billing Service — Powered by ActivityLog
 *
 * Instead of relying on Meta's conversation/pricing fields from webhooks
 * (which are not available for all account types), we calculate billing
 * from the ActivityLog table which captures every message reliably.
 *
 * Category mapping:
 *   - Template Campaign / Image Campaign / Template Message → marketing
 *   - Text Message / Image Message / regular messages → service
 *   - (Future: utility / authentication can be derived from template category)
 *
 * Every unique outbound message with status "sent" or "delivered" counts as
 * a billable event. Costs are calculated using the whatsappPricing config.
 */

import prisma from "../prisma.js";
import { calculateChargedCost } from "../utils/whatsappPricing.js";

/* ────────────────────────────────────────────────────────────────────
   Helpers
──────────────────────────────────────────────────────────────────── */

/**
 * Determine billing category from ActivityLog.type
 * @param {string} type - ActivityLog.type (e.g. "Template Campaign", "Text Message")
 * @returns {"marketing" | "service" | "utility" | "authentication"}
 */
export function getCategoryFromType(type) {
  if (!type) return "service";
  const t = type.toLowerCase();

  if (
    t.includes("template campaign") ||
    t.includes("image campaign") ||
    t.includes("campaign") ||
    t.includes("template message") ||
    t.includes("template")
  ) {
    return "marketing";
  }

  // Default: regular messages are "service" conversations (free tier or low cost)
  return "service";
}

/* ────────────────────────────────────────────────────────────────────
   1. Full Billing Summary (used by /analytics/whatsapp/vendor/:id)
──────────────────────────────────────────────────────────────────── */

/**
 * Compute billing analytics from ActivityLog data.
 *
 * @param {string} vendorId
 * @returns {Promise<object>}
 */
export async function getVendorBillingSummary(vendorId) {
  // Get all outbound "Sent" logs for this vendor (each is a unique message)
  const sentLogs = await prisma.activityLog.findMany({
    where: {
      vendorId,
      event: "Sent",
      status: { in: ["sent", "delivered", "read"] },
    },
    select: {
      id: true,
      messageId: true,
      type: true,
      status: true,
      createdAt: true,
    },
  });

  // Deduplicate by messageId (each wamid counted once)
  const uniqueMessages = new Map();
  for (const log of sentLogs) {
    const key = log.messageId || log.id;
    if (!uniqueMessages.has(key)) {
      uniqueMessages.set(key, log);
    }
  }

  const totalMessages = uniqueMessages.size;

  // Count by billing category
  const categories = {
    service: 0,
    utility: 0,
    marketing: 0,
    authentication: 0,
  };

  for (const [, log] of uniqueMessages) {
    const cat = getCategoryFromType(log.type);
    categories[cat]++;
  }

  const totalConversations = totalMessages; // 1 message = 1 billable event for now

  // Calculate costs
  let totalMetaCost = 0;
  let totalChargedCost = 0;

  for (const [cat, count] of Object.entries(categories)) {
    if (count > 0) {
      try {
        const { metaCost } = await calculateChargedCost(cat, "India");
        totalMetaCost += metaCost * count;
        totalChargedCost += metaCost * count;
      } catch {
        // Use zero if pricing fails
      }
    }
  }

  return {
    totalMessages,
    totalConversations,
    serviceConversations: categories.service,
    utilityConversations: categories.utility,
    marketingConversations: categories.marketing,
    authenticationConversations: categories.authentication,
    totalMetaCost: parseFloat(totalMetaCost.toFixed(4)),
    totalChargedCost: parseFloat(totalChargedCost.toFixed(4)),
  };
}

/* ────────────────────────────────────────────────────────────────────
   2. Dashboard Summary (used by /analytics/whatsapp/vendor/:id/summary)
──────────────────────────────────────────────────────────────────── */

/**
 * Quick dashboard stats from ActivityLog.
 *
 * @param {string} vendorId
 * @returns {Promise<object>}
 */
export async function getVendorDashboardSummary(vendorId) {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // Base filter: only "Sent" events that actually succeeded
  const baseWhere = {
    vendorId,
    event: "Sent",
    status: { in: ["sent", "delivered", "read"] },
  };

  const [todayLogs, monthLogs] = await Promise.all([
    prisma.activityLog.findMany({
      where: { ...baseWhere, createdAt: { gte: startOfToday } },
      select: { id: true, messageId: true, type: true },
    }),
    prisma.activityLog.findMany({
      where: { ...baseWhere, createdAt: { gte: startOfMonth } },
      select: { id: true, messageId: true, type: true },
    }),
  ]);

  // Deduplicate by messageId
  const dedup = (logs) => {
    const seen = new Set();
    return logs.filter((l) => {
      const key = l.messageId || l.id;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };

  const uniqueToday = dedup(todayLogs);
  const uniqueMonth = dedup(monthLogs);

  // Calculate cost this month
  const monthCategories = { service: 0, utility: 0, marketing: 0, authentication: 0 };
  for (const log of uniqueMonth) {
    const cat = getCategoryFromType(log.type);
    monthCategories[cat]++;
  }

  let costThisMonth = 0;
  for (const [cat, count] of Object.entries(monthCategories)) {
    if (count > 0) {
      try {
        const { metaCost } = await calculateChargedCost(cat, "India");
        costThisMonth += metaCost * count;
      } catch {
        // ignore
      }
    }
  }

  return {
    messagesToday: uniqueToday.length,
    messagesThisMonth: uniqueMonth.length,
    conversationsThisMonth: uniqueMonth.length,
    costThisMonth: parseFloat(costThisMonth.toFixed(4)),
  };
}

/* ────────────────────────────────────────────────────────────────────
   3. Conversations List (used by /vendor/:id/conversations)
──────────────────────────────────────────────────────────────────── */

/**
 * Build a virtual "conversations" list from ActivityLog entries.
 * Each unique messageId represents one billable conversation.
 *
 * @param {string} vendorId
 * @param {object} options
 * @param {number} [options.limit=50]
 * @param {number} [options.offset=0]
 * @param {string} [options.category] - Filter by category
 * @returns {Promise<{ conversations: Array, total: number }>}
 */
export async function getVendorConversations(vendorId, options = {}) {
  const { limit = 50, offset = 0, category } = options;

  const logs = await prisma.activityLog.findMany({
    where: {
      vendorId,
      event: "Sent",
      status: { in: ["sent", "delivered", "read"] },
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      messageId: true,
      type: true,
      phoneNumber: true,
      status: true,
      createdAt: true,
    },
  });

  // Deduplicate by messageId
  const unique = new Map();
  for (const log of logs) {
    const key = log.messageId || log.id;
    if (!unique.has(key)) {
      unique.set(key, log);
    }
  }

  // Build conversation-like records with computed costs
  const allConversations = [];

  for (const [key, log] of unique) {
    const cat = getCategoryFromType(log.type);

    // Filter by category if specified
    if (category && cat !== category.toLowerCase()) continue;

    let metaCost = 0;
    try {
      const costs = await calculateChargedCost(cat, "India");
      metaCost = costs.metaCost;
    } catch {
      // ignore
    }

    allConversations.push({
      id: log.id,
      vendorId,
      conversationId: key,
      category: cat,
      type: log.type,
      phoneNumber: log.phoneNumber,
      metaCost,
      chargedCost: metaCost, // Force chargedCost to be metaCost
      billable: true,
      createdAt: log.createdAt,
    });
  }

  const total = allConversations.length;
  const paginated = allConversations.slice(offset, offset + limit);

  return { conversations: paginated, total };
}

/* ────────────────────────────────────────────────────────────────────
   Legacy exports (kept for compatibility)
──────────────────────────────────────────────────────────────────── */

export async function trackMessage(params) {
  const { vendorId, waMessageId, phoneNumber, direction, messageType, status, conversationId, pricingCategory } = params;
  if (!vendorId || !waMessageId) return null;

  try {
    return await prisma.whatsappMessage.upsert({
      where: { waMessageId },
      update: {
        status: status || undefined,
        conversationId: conversationId || undefined,
        pricingCategory: pricingCategory || undefined,
      },
      create: {
        vendorId,
        waMessageId,
        phoneNumber: phoneNumber || "unknown",
        direction: direction || "outbound",
        messageType: messageType || null,
        status: status || null,
        conversationId: conversationId || null,
        pricingCategory: pricingCategory || null,
      },
    });
  } catch (err) {
    console.error("❌ trackMessage error:", err.message);
    return null;
  }
}

export async function processConversationBilling(params) {
  // This is now a no-op since billing is computed from ActivityLog
  // Keeping the export so existing webhook code doesn't break
  return null;
}
