import express from "express";
import fetch from "node-fetch";
import prisma from "../prisma.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { decrypt } from "../utils/encryption.js";

const router = express.Router();

/**
 * ===============================
 * CHECK IF NUMBER IS ON WHATSAPP
 * ===============================
 * Checks if a phone number exists in the system
 * and returns the conversation ID if it exists
 */
router.post(
  "/check-number",
  authenticate,
  asyncHandler(async (req, res) => {
    const { phoneNumber } = req.body;
    const vendorId = req.user.vendorId;

    // Validate phone number
    if (!phoneNumber) {
      return res.status(400).json({
        message: "Phone number is required",
      });
    }

    // Get vendor WhatsApp credentials
    const vendor = await prisma.vendor.findUnique({
      where: { id: vendorId },
      select: {
        whatsappPhoneNumberId: true,
        whatsappAccessToken: true,
        whatsappStatus: true,
      },
    });

    if (!vendor || vendor.whatsappStatus !== "connected") {
      return res.status(400).json({
        message: "WhatsApp is not connected for this vendor",
      });
    }

    try {
      // Format phone number (remove spaces, dashes, etc.)
      const formattedNumber = phoneNumber.replace(/\D/g, "");

      const whereLead = {
        vendorId,
        phoneNumber: formattedNumber,
      };

      const whereConversation = {
        vendorId,
        channel: "whatsapp",
        lead: {
          phoneNumber: formattedNumber,
        },
      };

      // 🔒 ROLE-BASED FILTERING
      if (req.user.role === "sales") {
        whereLead.salesPersonId = req.user.id;
        whereConversation.lead = {
          ...whereConversation.lead,
          salesPersonId: req.user.id,
        };
      }

      // Check if lead exists with this phone number
      const existingLead = await prisma.lead.findFirst({
        where: whereLead,
      });

      // Check if conversation already exists
      const existingConversation = await prisma.conversation.findFirst({
        where: whereConversation,
        include: {
          lead: {
            select: {
              id: true,
              phoneNumber: true,
              companyName: true,
              salesPersonName: true,
            },
          },
        },
      });

      if (existingConversation) {
        return res.json({
          isOnWhatsApp: true,
          phoneNumber: formattedNumber,
          conversationExists: true,
          conversationId: existingConversation.id,
          lead: existingConversation.lead,
        });
      }

      // If lead exists but no conversation, we can assume they're on WhatsApp
      if (existingLead) {
        return res.json({
          isOnWhatsApp: true,
          phoneNumber: formattedNumber,
          conversationExists: false,
          lead: {
            id: existingLead.id,
            phoneNumber: existingLead.phoneNumber,
            companyName: existingLead.companyName,
          },
        });
      }

      // Number not found in system - can still create conversation
      return res.json({
        isOnWhatsApp: true, // Assume yes, will be verified when first message is sent
        phoneNumber: formattedNumber,
        conversationExists: false,
      });
    } catch (error) {
      console.error("Error checking WhatsApp number:", error);
      return res.status(500).json({
        message: "Failed to check WhatsApp number",
        error: error.message,
      });
    }
  }),
);

/**
 * ===============================
 * CREATE NEW CONVERSATION
 * ===============================
 * Creates a new conversation for a WhatsApp number
 * Auto-assigns lead to sales person if they create it
 */
router.post(
  "/create-conversation",
  authenticate,
  asyncHandler(async (req, res) => {
    const { phoneNumber, companyName } = req.body;
    const vendorId = req.user.vendorId;
    const userId = req.user.id;
    const userRole = req.user.role;

    if (!phoneNumber) {
      return res.status(400).json({
        message: "Phone number is required",
      });
    }

    const formattedNumber = phoneNumber.replace(/\D/g, "");

    // Check if lead exists globally in vendor
    let lead = await prisma.lead.findFirst({
      where: {
        vendorId,
        phoneNumber: formattedNumber,
      },
    });

    // 🔒 ROLE-BASED PROTECTION
    if (lead && req.user.role === "sales") {
      // 1. Check if we have a Name match but ID Mismatch (Data Corruption Fix)
      // If the visible Name matches the User, we assume the User owns it and the ID is outdated.
      if (
        lead.salesPersonName === req.user.name &&
        lead.salesPersonId !== req.user.id
      ) {
        // Fix the ID to match the User
        lead = await prisma.lead.update({
          where: { id: lead.id },
          data: { salesPersonId: req.user.id },
        });
      }
      // 2. Otherwise, enforce ID ownership if ID exists
      else if (lead.salesPersonId && lead.salesPersonId !== req.user.id) {
        return res.status(403).json({
          message:
            "This number is already assigned to another sales person",
        });
      }
      // 3. Enforce Name ownership if ID is missing (Legacy)
      else if (
        !lead.salesPersonId &&
        lead.salesPersonName &&
        lead.salesPersonName !== req.user.name
      ) {
        return res.status(403).json({
          message:
            "This number is already assigned to another sales person",
        });
      }
    }

    // Create lead if it doesn't exist
    if (!lead) {
      // Determine assignment based on user role
      let salesPersonId = null;
      let salesPersonName = null;

      // If the creator is a sales person, auto-assign to them
      if (userRole === "sales") {
        // Get the user's name
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { name: true },
        });
        salesPersonId = userId;
        salesPersonName = user?.name || null;
      }
      // If vendor_owner or vendor_admin, leave both fields as null

      lead = await prisma.lead.create({
        data: {
          vendorId,
          phoneNumber: formattedNumber,
          companyName: companyName || formattedNumber,
          status: "new",
          salesPersonId, // Auto-assign ID for sales person, null for admins/owners
          salesPersonName, // Auto-assign name for sales person, null for admins/owners
        },
      });
    } else if (req.user.role === "sales" && !lead.salesPersonId) {
      // Auto-assign if unassigned OR backfill ID if missing (but name matched)
      lead = await prisma.lead.update({
        where: { id: lead.id },
        data: {
          salesPersonName: req.user.name,
          salesPersonId: userId,
        },
      });
    }

    // Check if conversation already exists
    let conversation = await prisma.conversation.findFirst({
      where: {
        vendorId,
        leadId: lead.id,
        channel: "whatsapp",
      },
    });

    // Create conversation if it doesn't exist
    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          vendorId,
          leadId: lead.id,
          channel: "whatsapp",
          lastMessageAt: new Date(),
        },
      });
    }

    return res.json({
      conversationId: conversation.id,
      lead: {
        id: lead.id,
        phoneNumber: lead.phoneNumber,
        companyName: lead.companyName,
        salesPersonId: lead.salesPersonId,
        salesPersonName: lead.salesPersonName,
      },
    });
  }),
);

export default router;
