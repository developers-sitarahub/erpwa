import prisma from "../prisma.js";
import { logActivity } from "./activityLog.service.js";

class LeadService {
  static async create(user, data) {
    if (!data.phoneNumber) {
      throw new Error("phoneNumber is required");
    }
    const vendorId = user.vendorId;

    const lead = await prisma.lead.upsert({
      where: {
        vendorId_phoneNumber: {
          vendorId,
          phoneNumber: data.phoneNumber,
        },
      },
      update: {
        ...(data.companyName !== undefined && { companyName: data.companyName }),
        ...(data.email !== undefined && { email: data.email }),
        ...(data.city !== undefined && { city: data.city }),
        ...(data.category !== undefined && { category: data.category }),
        ...(data.subcategory !== undefined && { subcategory: data.subcategory }),
        ...(data.whatsappOptIn !== undefined && {
          whatsappOptIn: data.whatsappOptIn,
        }),
        // 🔒 ROLE-BASED: Auto-assign if salesperson is updating unassigned
        ...(user.role === "sales" && { salesPersonName: user.name }),
        updatedAt: new Date(),
      },

      create: {
        vendorId,
        companyName: data.companyName ?? null,
        email: data.email ?? null,
        phoneNumber: data.phoneNumber,
        city: data.city ?? null,
        // category: data.category ?? "standard", // Not in schema, skipping to avoid crash
        // subcategory: data.subcategory ?? null, // Not in schema, skipping
        whatsappOptIn: data.whatsappOptIn ?? true,
        optInSource: "manual",
        optInAt: new Date(),
        status: "new",
        // 🔒 ROLE-BASED: Auto-assign if salesperson is creating
        ...(user.role === "sales" && { salesPersonName: user.name }),
      },
    });

    // 🔥 Ensure conversation exists
    await prisma.conversation.upsert({
      where: {
        vendorId_leadId: {
          vendorId,
          leadId: lead.id,
        },
      },
      update: {},
      create: {
        vendorId,
        leadId: lead.id,
        channel: "whatsapp",
        isOpen: true,
      },
    });

    // 🔥 Log Activity
    await logActivity({
      vendorId,
      type: "Lead",
      event: "Lead Created",
      status: "success",
      phoneNumber: lead.phoneNumber,
      payload: {
        leadId: lead.id,
        source: "manual",
        salesPerson: lead.salesPersonName
      }
    });

    return lead;
  }

  static async list(user, query = {}) {
    const {
      search,
      status,
      category,
      subcategory,
      city,
      limit = 50,
      offset = 0,
    } = query;
    const vendorId = user.vendorId;

    const where = {
      vendorId,
      deletedAt: null,
      ...(status && { status }),
      // ...(category && { category }), // Not in schema
      // ...(subcategory && { subcategory }), // Not in schema
      ...(city && { city }),
      ...(search && {
        OR: [
          { companyName: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
          { phoneNumber: { contains: search } },
        ],
      }),
    };

    // 🔒 ROLE-BASED FILTERING
    if (user.role === "sales") {
      where.salesPersonName = user.name;
    }

    return prisma.lead.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: Number(limit),
      skip: Number(offset),
    });
  }

  static async getById(user, id) {
    const vendorId = user.vendorId;
    const where = { id, vendorId, deletedAt: null };

    // 🔒 ROLE-BASED FILTERING
    if (user.role === "sales") {
      where.salesPersonName = user.name;
    }

    return prisma.lead.findFirst({
      where,
    });
  }

  static async update(user, id, data) {
    const vendorId = user.vendorId;
    const where = { id, vendorId, deletedAt: null };

    // 🔒 ROLE-BASED PROTECTION
    if (user.role === "sales") {
      where.salesPersonName = user.name;
    }

    // Check if salesperson is allowed to update this lead
    const existingLead = await prisma.lead.findFirst({ where });
    if (!existingLead) {
      throw new Error("Lead not found or unauthorized");
    }

    const updatedLead = await prisma.lead.update({
      where: { id },
      data: {
        companyName: data.companyName ?? undefined,
        email: data.email ?? undefined,
        city: data.city ?? undefined,
        // category: data.category ?? undefined,
        // subcategory: data.subcategory ?? undefined,
        status: data.status ?? undefined,
        whatsappOptIn:
          data.whatsappOptIn !== undefined ? data.whatsappOptIn : undefined,
        blockedAt: data.blockedAt ?? undefined,
        updatedAt: new Date(),
      },
    });

    // 🔥 Log Activity if status changed
    if (data.status && data.status !== existingLead.status) {
      await logActivity({
        vendorId,
        type: "Lead",
        event: "Status Updated",
        status: data.status,
        phoneNumber: existingLead.phoneNumber,
        payload: {
          leadId: id,
          oldStatus: existingLead.status,
          newStatus: data.status,
          updatedBy: user.name,
          companyName: existingLead.companyName
        }
      });
    }

    return updatedLead;
  }

  static async delete(user, id) {
    const vendorId = user.vendorId;
    const where = { id, vendorId };

    // 🔒 ROLE-BASED PROTECTION
    if (user.role === "sales") {
      where.salesPersonName = user.name;
    }

    const existingLead = await prisma.lead.findFirst({ where });
    if (!existingLead) {
      throw new Error("Lead not found or unauthorized");
    }

    const deletedLead = await prisma.lead.delete({
      where: { id },
    });
    console.log(`Hard deleted lead with ID ${id}:`, deletedLead);
    return deletedLead;
  }
}

export default LeadService;
