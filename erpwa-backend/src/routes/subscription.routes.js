import express from "express";
import prisma from "../prisma.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { requireRoles } from "../middleware/requireRole.middleware.js";
import { razorpay, verifyRazorpaySignature, verifyWebhookSignature } from "../utils/razorpay.js";
import { createInvoice } from "../utils/invoice.js";

const router = express.Router();

// ─────────────────────────────────────────────────────────────
// GET /api/subscription/public-plans
// Publicly accessible plans for landing page
// ─────────────────────────────────────────────────────────────
router.get("/public-plans", async (req, res) => {
  try {
    const plans = await prisma.subscriptionPlan.findMany({
      where: { isActive: true },
      orderBy: { price: "asc" },
    });
    return res.json(plans);
  } catch (err) {
    console.error("subscription/public-plans error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /api/subscription/plans
// All active plans (for pricing page)
// ─────────────────────────────────────────────────────────────
router.get("/plans", authenticate, async (req, res) => {
  try {
    const plans = await prisma.subscriptionPlan.findMany({
      where: { isActive: true },
      orderBy: { price: "asc" },
    });
    return res.json(plans);
  } catch (err) {
    console.error("subscription/plans error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /api/subscription/status
// Current vendor subscription + usage stats + days remaining
// ─────────────────────────────────────────────────────────────
router.get(
  "/status",
  authenticate,
  requireRoles(["vendor_owner", "vendor_admin", "sales"]),
  async (req, res) => {
    try {
      const vendor = await prisma.vendor.findUnique({
        where: { id: req.user.vendorId },
        select: {
          subscriptionStart: true,
          subscriptionEnd: true,
          subscriptionPlan: {
            select: {
              id: true,
              name: true,
              price: true,
              currency: true,
              durationDays: true,
              conversationLimit: true,
              galleryLimit: true,
              chatbotLimit: true,
              templateLimit: true,
              formLimit: true,
              teamUsersLimit: true,
            },
          },
        },
      });

      if (!vendor) return res.status(404).json({ message: "Vendor not found" });

      const now = new Date();
      const endDate = vendor.subscriptionEnd;
      const isExpired = endDate ? endDate < now : true;
      const daysRemaining = endDate
        ? Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
        : 0;

      // Usage stats
      let usage = null;
      if (vendor.subscriptionPlan) {
        const [templates, conversations, chatbots, teamUsers, gallery] = await Promise.all([
          prisma.template.count({
            where: {
              vendorId: req.user.vendorId,
              status: { in: ["approved", "APPROVED", "pending", "PENDING", "active", "ACTIVE"] },
            },
          }),
          prisma.conversation.count({ where: { vendorId: req.user.vendorId } }),
          prisma.workflow.count({ where: { vendorId: req.user.vendorId } }),
          prisma.user.count({
            where: { vendorId: req.user.vendorId, role: { not: "vendor_owner" } },
          }),
          prisma.galleryImage.count({ where: { vendorId: req.user.vendorId } }),
        ]);
        usage = { templates, conversations, chatbots, teamUsers, gallery };
      }

      return res.json({
        plan: vendor.subscriptionPlan || null,
        subscriptionStart: vendor.subscriptionStart,
        subscriptionEnd: endDate,
        isExpired,
        daysRemaining,
        usage,
      });
    } catch (err) {
      console.error("subscription/status error:", err);
      return res.status(500).json({ message: "Internal server error" });
    }
  }
);

// ─────────────────────────────────────────────────────────────
// GET /api/subscription/payments
// Billing history for the current vendor
// ─────────────────────────────────────────────────────────────
router.get(
  "/payments",
  authenticate,
  requireRoles(["vendor_owner", "vendor_admin"]),
  async (req, res) => {
    try {
      const payments = await prisma.vendorPayment.findMany({
        where: { vendorId: req.user.vendorId },
        include: {
          subscription: {
            include: { plan: { select: { name: true } } }
          }
        },
        orderBy: { createdAt: "desc" },
      });
      return res.json(payments);
    } catch (err) {
      console.error("subscription/payments error:", err);
      return res.status(500).json({ message: "Internal server error" });
    }
  }
);

// ─────────────────────────────────────────────────────────────
// POST /api/subscription/create-order
// Creates a Razorpay order for a given plan
// ─────────────────────────────────────────────────────────────
router.post(
  "/create-order",
  authenticate,
  requireRoles(["vendor_owner"]),
  async (req, res) => {
    try {
      const { planId } = req.body;
      if (!planId) return res.status(400).json({ message: "planId is required" });

      const plan = await prisma.subscriptionPlan.findUnique({ where: { id: planId } });
      if (!plan) return res.status(404).json({ message: "Plan not found" });
      
      if (plan.price === 0) {
        return res.status(400).json({ message: "Free plan does not require payment" });
      }

      if (plan.name === "Unlimited") {
        return res.status(400).json({ message: "The Unlimited plan requires direct contact for setup." });
      }

      // Amount in paise (Razorpay uses smallest currency unit)
      const amountInPaise = Math.round(plan.price * 100);

      const order = await razorpay.orders.create({
        amount: amountInPaise,
        currency: plan.currency || "INR",
        receipt: `sub_${req.user.vendorId.slice(0, 8)}_${Date.now()}`,
        notes: {
          vendorId: req.user.vendorId,
          planId: plan.id,
          planName: plan.name,
        },
      });

      // Pre-create a pending payment record
      await prisma.vendorPayment.create({
        data: {
          vendorId: req.user.vendorId,
          amount: plan.price,
          currency: plan.currency || "INR",
          razorpayOrderId: order.id,
          status: "pending",
          planName: plan.name,
          planDuration: plan.durationDays,
        },
      });

      return res.json({
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        planName: plan.name,
        planId: plan.id,
      });
    } catch (err) {
      console.error("create-order error:", err);
      return res.status(500).json({ message: "Failed to create payment order" });
    }
  }
);

// ─────────────────────────────────────────────────────────────
// POST /api/subscription/verify-payment
// Verifies Razorpay signature + activates subscription
// ─────────────────────────────────────────────────────────────
router.post(
  "/verify-payment",
  authenticate,
  requireRoles(["vendor_owner"]),
  async (req, res) => {
    try {
      const { razorpayOrderId, razorpayPaymentId, razorpaySignature, planId } = req.body;

      if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature || !planId) {
        return res.status(400).json({ message: "Missing required payment fields" });
      }

      // 1. Verify signature
      const isValid = verifyRazorpaySignature(razorpayOrderId, razorpayPaymentId, razorpaySignature);
      if (!isValid) {
        return res.status(400).json({ message: "Invalid payment signature. Payment verification failed." });
      }

      // 2. Idempotency check — don't activate twice for same payment
      const existingPayment = await prisma.vendorPayment.findUnique({
        where: { razorpayPaymentId },
      });
      if (existingPayment?.status === "captured") {
        return res.json({ message: "Payment already processed", alreadyActivated: true });
      }

      // 3. Get plan
      const plan = await prisma.subscriptionPlan.findUnique({ where: { id: planId } });
      if (!plan) return res.status(404).json({ message: "Plan not found" });

      const startDate = new Date();
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + plan.durationDays);

      // 4. Deactivate current active subscription
      await prisma.vendorSubscription.updateMany({
        where: { vendorId: req.user.vendorId, status: { in: ["active", "trial"] } },
        data: { status: "cancelled" },
      });

      // 5. Create new subscription record
      const subscription = await prisma.vendorSubscription.create({
        data: {
          vendorId: req.user.vendorId,
          planId: plan.id,
          status: "active",
          startDate,
          endDate,
          razorpayOrderId,
          razorpayPaymentId,
        },
      });

      // 6. Update vendor's current plan + dates
      await prisma.vendor.update({
        where: { id: req.user.vendorId },
        data: {
          subscriptionPlanId: plan.id,
          subscriptionStart: startDate,
          subscriptionEnd: endDate,
        },
      });

      // 7. Update the pre-created payment record
      await prisma.vendorPayment.updateMany({
        where: { razorpayOrderId },
        data: {
          razorpayPaymentId,
          razorpaySignature,
          status: "captured",
          subscriptionId: subscription.id,
        },
      });

      // 8. Generate invoice
      const paymentRecord = await prisma.vendorPayment.findUnique({ where: { razorpayOrderId } });
      if (paymentRecord) {
        await createInvoice({
          paymentId: paymentRecord.id,
          vendorId: req.user.vendorId,
          planName: plan.name,
          planDuration: plan.durationDays,
          amount: plan.price,
          currency: plan.currency || "INR",
        });
      }

      console.log(`✅ [Subscription] Vendor ${req.user.vendorId} upgraded to ${plan.name} until ${endDate.toISOString()}`);

      return res.json({
        message: `${plan.name} plan activated successfully!`,
        subscription: {
          planName: plan.name,
          startDate,
          endDate,
          daysRemaining: plan.durationDays,
        },
      });
    } catch (err) {
      console.error("verify-payment error:", err);
      return res.status(500).json({ message: "Failed to verify payment" });
    }
  }
);

// ─────────────────────────────────────────────────────────────
// POST /api/subscription/webhook
// Razorpay Webhook (backup for missed verify-payment calls)
// IMPORTANT: Must use raw body — registered separately in server.js
// ─────────────────────────────────────────────────────────────
router.post("/webhook", async (req, res) => {
  try {
    const signature = req.headers["x-razorpay-signature"];
    if (!signature) return res.status(400).json({ message: "No signature" });

    const rawBody = req.rawBody; // Set by express.raw() in server.js
    if (!rawBody) return res.status(400).json({ message: "No raw body" });

    const isValid = verifyWebhookSignature(rawBody, signature);
    if (!isValid) {
      console.warn("⚠️ [Webhook] Invalid Razorpay signature");
      return res.status(400).json({ message: "Invalid webhook signature" });
    }

    const event = JSON.parse(rawBody);
    const eventType = event.event;

    console.log(`[Webhook] Received event: ${eventType}`);

    if (eventType === "payment.captured") {
      const payment = event.payload.payment.entity;
      const orderId = payment.order_id;
      const paymentId = payment.id;

      // Check if already processed
      const existing = await prisma.vendorPayment.findUnique({
        where: { razorpayOrderId: orderId },
      });

      if (existing && existing.status !== "captured") {
        // Get plan from the order notes via Razorpay API
        const order = await razorpay.orders.fetch(orderId);
        const planId = order.notes?.planId;
        const vendorId = order.notes?.vendorId;

        if (planId && vendorId) {
          const plan = await prisma.subscriptionPlan.findUnique({ where: { id: planId } });
          if (plan) {
            const startDate = new Date();
            const endDate = new Date(startDate);
            endDate.setDate(endDate.getDate() + plan.durationDays);

            await prisma.vendorSubscription.updateMany({
              where: { vendorId, status: { in: ["active", "trial"] } },
              data: { status: "cancelled" },
            });

            const subscription = await prisma.vendorSubscription.create({
              data: { vendorId, planId: plan.id, status: "active", startDate, endDate, razorpayOrderId: orderId, razorpayPaymentId: paymentId },
            });

            await prisma.vendor.update({
              where: { id: vendorId },
              data: { subscriptionPlanId: plan.id, subscriptionStart: startDate, subscriptionEnd: endDate },
            });

            await prisma.vendorPayment.updateMany({
              where: { razorpayOrderId: orderId },
              data: { razorpayPaymentId: paymentId, status: "captured", subscriptionId: subscription.id },
            });

            // Generate invoice via webhook
            const webhookPayment = await prisma.vendorPayment.findUnique({ where: { razorpayOrderId: orderId } });
            if (webhookPayment) {
              await createInvoice({
                paymentId: webhookPayment.id,
                vendorId,
                planName: plan.name,
                planDuration: plan.durationDays,
                amount: plan.price,
                currency: plan.currency || "INR",
              });
            }

            console.log(`✅ [Webhook] Activated ${plan.name} for vendor ${vendorId}`);
          }
        }
      }
    } else if (eventType === "payment.failed") {
      const payment = event.payload.payment.entity;
      const orderId = payment.order_id;
      const paymentId = payment.id;

      console.log(`❌ [Webhook] Payment failed for order ${orderId}`);

      await prisma.vendorPayment.updateMany({
        where: { razorpayOrderId: orderId },
        data: {
          razorpayPaymentId: paymentId,
          status: "failed",
        },
      });
    }

    return res.json({ received: true });
  } catch (err) {
    console.error("webhook error:", err);
    return res.status(500).json({ message: "Webhook processing failed" });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /api/subscription/invoice/:paymentId
// Returns full invoice details for a specific payment
// ─────────────────────────────────────────────────────────────
router.get(
  "/invoice/:paymentId",
  authenticate,
  requireRoles(["vendor_owner", "vendor_admin"]),
  async (req, res) => {
    try {
      const payment = await prisma.vendorPayment.findFirst({
        where: {
          id: req.params.paymentId,
          vendorId: req.user.vendorId,
        },
        include: {
          vendor: { select: { name: true } },
          subscription: {
            include: { plan: { select: { name: true, price: true, currency: true, durationDays: true } } }
          },
        },
      });

      if (!payment) {
        return res.status(404).json({ message: "Invoice not found" });
      }

      return res.json({
        id: payment.id,
        invoiceNumber: payment.invoiceNumber || `TXN-${payment.id.slice(0, 8).toUpperCase()}`,
        invoiceDate: payment.invoiceDate || payment.createdAt,
        status: payment.status,
        billingName: payment.billingName || payment.vendor?.name || "Customer",
        billingEmail: payment.billingEmail || null,
        planName: payment.planName || payment.subscription?.plan?.name || "Plan",
        planDuration: payment.planDuration || payment.subscription?.plan?.durationDays || 30,
        amount: payment.amount,
        taxAmount: payment.taxAmount || 0,
        totalAmount: payment.amount + (payment.taxAmount || 0),
        currency: payment.currency,
        gateway: payment.gateway,
        razorpayOrderId: payment.razorpayOrderId,
        razorpayPaymentId: payment.razorpayPaymentId,
        createdAt: payment.createdAt,
      });
    } catch (err) {
      console.error("invoice detail error:", err);
      return res.status(500).json({ message: "Failed to fetch invoice" });
    }
  }
);

export default router;
