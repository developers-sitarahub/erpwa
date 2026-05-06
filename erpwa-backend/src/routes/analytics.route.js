/**
 * WhatsApp Analytics & Billing API Routes
 * 
 * Protected routes for vendor analytics and wallet management.
 * 
 * GET  /analytics/whatsapp/vendor/:vendorId            → Full billing summary
 * GET  /analytics/whatsapp/vendor/:vendorId/summary     → Dashboard quick stats
 * GET  /analytics/whatsapp/vendor/:vendorId/wallet       → Wallet balance & history
 * GET  /analytics/whatsapp/vendor/:vendorId/conversations → Conversation list
 */

import express from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import {
  getVendorBillingSummary,
  getVendorDashboardSummary,
} from "../services/whatsappBilling.service.js";
import {
  getBalance,
  getTransactionHistory,
} from "../services/wallet.service.js";
import prisma from "../prisma.js";

const router = express.Router();

/* ===============================
   1. Full Billing Analytics
=============================== */
router.get("/vendor/:vendorId", authenticate, async (req, res) => {
  try {
    const { vendorId } = req.params;

    // Authorization: Ensure user belongs to this vendor
    if (req.user.vendorId !== vendorId && req.user.role !== "owner") {
      return res.status(403).json({ message: "Forbidden" });
    }

    const summary = await getVendorBillingSummary(vendorId);

    return res.json({
      success: true,
      data: summary,
    });
  } catch (err) {
    console.error("❌ Analytics error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch analytics",
      error: err.message,
    });
  }
});

/* ===============================
   2. Dashboard Summary (Quick Stats)
=============================== */
router.get("/vendor/:vendorId/summary", authenticate, async (req, res) => {
  try {
    const { vendorId } = req.params;

    if (req.user.vendorId !== vendorId && req.user.role !== "owner") {
      return res.status(403).json({ message: "Forbidden" });
    }

    const summary = await getVendorDashboardSummary(vendorId);

    return res.json({
      success: true,
      data: summary,
    });
  } catch (err) {
    console.error("❌ Dashboard summary error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard summary",
      error: err.message,
    });
  }
});

/* ===============================
   3. Wallet Balance & History
=============================== */
router.get("/vendor/:vendorId/wallet", authenticate, async (req, res) => {
  try {
    const { vendorId } = req.params;

    if (req.user.vendorId !== vendorId && req.user.role !== "owner") {
      return res.status(403).json({ message: "Forbidden" });
    }

    const [balance, transactions] = await Promise.all([
      getBalance(vendorId),
      getTransactionHistory(vendorId, {
        limit: parseInt(req.query.limit) || 50,
        offset: parseInt(req.query.offset) || 0,
      }),
    ]);

    return res.json({
      success: true,
      data: {
        balance,
        transactions,
      },
    });
  } catch (err) {
    console.error("❌ Wallet error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch wallet data",
      error: err.message,
    });
  }
});

/* ===============================
   4. Conversation List (Paginated)
=============================== */
router.get("/vendor/:vendorId/conversations", authenticate, async (req, res) => {
  try {
    const { vendorId } = req.params;

    if (req.user.vendorId !== vendorId && req.user.role !== "owner") {
      return res.status(403).json({ message: "Forbidden" });
    }

    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;
    const category = req.query.category; // Optional filter

    const where = { vendorId };
    if (category) {
      where.category = category.toLowerCase();
    }

    const [conversations, total] = await Promise.all([
      prisma.whatsappConversation.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.whatsappConversation.count({ where }),
    ]);

    return res.json({
      success: true,
      data: {
        conversations,
        total,
        limit,
        offset,
      },
    });
  } catch (err) {
    console.error("❌ Conversations list error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch conversations",
      error: err.message,
    });
  }
});

/* ===============================
   5. Messages (Paginated by date range)
=============================== */
router.get("/vendor/:vendorId/messages", authenticate, async (req, res) => {
  try {
    const { vendorId } = req.params;

    if (req.user.vendorId !== vendorId && req.user.role !== "owner") {
      return res.status(403).json({ message: "Forbidden" });
    }

    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;

    const where = { vendorId };

    // Date range filter
    if (req.query.from || req.query.to) {
      where.createdAt = {};
      if (req.query.from) where.createdAt.gte = new Date(req.query.from);
      if (req.query.to) where.createdAt.lte = new Date(req.query.to);
    }

    // Direction filter
    if (req.query.direction) {
      where.direction = req.query.direction;
    }

    const [messages, total] = await Promise.all([
      prisma.whatsappMessage.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.whatsappMessage.count({ where }),
    ]);

    return res.json({
      success: true,
      data: {
        messages,
        total,
        limit,
        offset,
      },
    });
  } catch (err) {
    console.error("❌ Messages list error:", err.message);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch messages",
      error: err.message,
    });
  }
});

export default router;
