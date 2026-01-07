import prisma from "../prisma.js";

class LeadService {
  static async create(vendorId, data) {
    if (!data.phoneNumber) {
      throw new Error("phoneNumber is required");
    }

    const lead = await prisma.lead.upsert({
      where: {
        vendorId_phoneNumber: {
          vendorId,
          phoneNumber: data.phoneNumber,
        },
      },

      // update: {
      //   companyName: data.companyName ?? undefined,
      //   email: data.email ?? undefined,
      //   city: data.city ?? undefined,
      //   category: data.category ?? undefined,
      //   subcategory: data.subcategory ?? undefined,
      //   whatsappOptIn:
      //     data.whatsappOptIn !== undefined ? data.whatsappOptIn : undefined,
      //   updatedAt: new Date(),
      // },
      update: {
        ...(data.companyName !== undefined && { companyName: data.companyName }),
        ...(data.email !== undefined && { email: data.email }),
        ...(data.city !== undefined && { city: data.city }),
        ...(data.category !== undefined && { category: data.category }),
        ...(data.subcategory !== undefined && { subcategory: data.subcategory }),
        ...(data.whatsappOptIn !== undefined && {
          whatsappOptIn: data.whatsappOptIn,
        }),
        updatedAt: new Date(),
      },


      create: {
        vendorId,
        companyName: data.companyName ?? null,
        email: data.email ?? null,
        phoneNumber: data.phoneNumber,
        city: data.city ?? null,
        category: data.category ?? "standard",
        subcategory: data.subcategory ?? null,
        whatsappOptIn: data.whatsappOptIn ?? true,
        optInSource: "manual",
        optInAt: new Date(),
        status: "new",
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

    return lead;
  }

  static async list(vendorId, query = {}) {
    const {
      search,
      status,
      category,
      subcategory,
      city,
      limit = 50,
      offset = 0,
    } = query;

    return prisma.lead.findMany({
      where: {
        vendorId,
        deletedAt: null,
        ...(status && { status }),
        ...(category && { category }),
        ...(subcategory && { subcategory }),
        ...(city && { city }),
        ...(search && {
          OR: [
            { companyName: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
            { phoneNumber: { contains: search } },
          ],
        }),
      },
      orderBy: { createdAt: "desc" },
      take: Number(limit),
      skip: Number(offset),
    });
  }

  static async getById(vendorId, id) {
    return prisma.lead.findFirst({
      where: { id, vendorId, deletedAt: null },
    });
  }

  static async update(vendorId, id, data) {
    return prisma.lead.update({
      where: { id },
      data: {
        companyName: data.companyName ?? undefined,
        email: data.email ?? undefined,
        city: data.city ?? undefined,
        category: data.category ?? undefined,
        subcategory: data.subcategory ?? undefined,
        status: data.status ?? undefined,
        whatsappOptIn:
          data.whatsappOptIn !== undefined ? data.whatsappOptIn : undefined,
        blockedAt: data.blockedAt ?? undefined,
        updatedAt: new Date(),
      },
    });
  }

  static async delete(vendorId, id) {
    const deletedLead = await prisma.lead.delete({
      where: { id, vendorId }, // Add vendorId to ensure ownership
    });
    console.log(`Hard deleted lead with ID ${id}:`, deletedLead);
    return deletedLead;
  }
}

export default LeadService;
