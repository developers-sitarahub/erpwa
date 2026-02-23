import prisma from "../prisma.js";
import { logActivity } from "./activityLog.service.js";

/**
 * Lead Management Service
 * Handles CRUD operations for the Leads Management page
 * This is separate from the existing lead.service.js which handles different lead operations
 */
class LeadManagementService {
  /**
   * List all leads with optional filtering
   * Returns leads array and total count
   */
  static async list(user, filters = {}) {
    const { category_id, subcategory_id, status } = filters;
    const vendorId = user.vendorId;

    const where = {
      vendorId,
    };

    // 🔒 ROLE-BASED FILTERING: Sales persons only see their assigned leads
    if (user.role === "sales") {
      where.salesPersonName = user.name;
    }

    if (subcategory_id && !isNaN(subcategory_id)) {
      where.subCategoryId = parseInt(subcategory_id);
    } else if (category_id && !isNaN(category_id)) {
      where.categoryId = parseInt(category_id);
    }

    if (status) {
      where.status = status;
    }

    // Get total count
    const totalCount = await prisma.lead.count({ where });

    // Get leads with pagination support (optional)
    const leads = await prisma.lead.findMany({
      where,
      include: {
        leadCategory: {
          select: {
            id: true,
            name: true,
          },
        },
        leadSubCategory: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Get count by status
    const statusCounts = await prisma.lead.groupBy({
      by: ["status"],
      where,
      _count: true,
    });

    const statusCountMap = {};
    statusCounts.forEach((item) => {
      statusCountMap[item.status] = item._count;
    });

    return {
      leads: leads.map((lead) => ({
        id: lead.id,
        company_name: lead.companyName || "",
        mobile_number: lead.phoneNumber,
        email: lead.email || "",
        city: lead.city || "",
        category: lead.categoryId,
        category_name: lead.leadCategory?.name,
        sub_category: lead.subCategoryId,
        sub_category_name: lead.leadSubCategory?.name,
        sales_person_name: lead.salesPersonName,
        status: lead.status || "new",
        assigned_to: null, // Can be added later if needed
        created_at: lead.createdAt.toISOString(),
      })),
      total: totalCount,
      status_counts: statusCountMap,
    };
  }

  /**
   * Get lead by ID
   */
  static async getById(user, id) {
    const vendorId = user.vendorId;
    const where = {
      id,
      vendorId,
    };

    // 🔒 ROLE-BASED FILTERING
    if (user.role === "sales") {
      where.salesPersonName = user.name;
    }

    const lead = await prisma.lead.findFirst({
      where,
      include: {
        leadCategory: {
          select: {
            id: true,
            name: true,
          },
        },
        leadSubCategory: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!lead) {
      return null;
    }

    return {
      id: lead.id,
      company_name: lead.companyName || "",
      mobile_number: lead.phoneNumber,
      email: lead.email || "",
      city: lead.city || "",
      category: lead.categoryId,
      category_name: lead.leadCategory?.name,
      sub_category: lead.subCategoryId,
      sub_category_name: lead.leadSubCategory?.name,
      sales_person_name: lead.salesPersonName,
      status: lead.status || "new",
      assigned_to: null,
      created_at: lead.createdAt.toISOString(),
    };
  }

  /**
   * Create a single lead
   */
  static async create(user, data) {
    const vendorId = user.vendorId;
    const {
      company_name,
      mobile_number,
      email,
      city,
      category_id,
      subcategory_id,
      sales_person_name,
      status = "new",
    } = data;

    if (!mobile_number) {
      throw new Error("Mobile number is required");
    }

    // Check if lead already exists
    const existing = await prisma.lead.findFirst({
      where: {
        vendorId,
        phoneNumber: mobile_number.trim(),
        deletedAt: null,
      },
    });

    if (existing) {
      throw new Error("Lead with this mobile number already exists");
    }

    // Verify category exists if provided
    if (category_id) {
      const category = await prisma.category.findFirst({
        where: {
          id: parseInt(category_id),
          vendorId,
        },
      });

      if (!category) {
        throw new Error("Category not found");
      }
    }

    // Verify subcategory exists if provided
    if (subcategory_id) {
      const subcategory = await prisma.category.findFirst({
        where: {
          id: parseInt(subcategory_id),
          vendorId,
          parentId: category_id ? parseInt(category_id) : undefined,
        },
      });

      if (!subcategory) {
        throw new Error("Subcategory not found or does not belong to the selected category");
      }
    }

    // 🛡️ ROLE-BASED: Auto-assign if salesperson is creating
    const finalSalesPersonName = (user.role === "sales") ? user.name : (sales_person_name?.trim() || null);

    // Create lead
    const lead = await prisma.lead.create({
      data: {
        vendorId,
        companyName: company_name?.trim() || null,
        phoneNumber: mobile_number.trim(),
        email: email?.trim() || null,
        city: city?.trim() || null,
        categoryId: category_id ? parseInt(category_id) : null,
        subCategoryId: subcategory_id ? parseInt(subcategory_id) : null,
        salesPersonName: finalSalesPersonName,
        status: status,
      },
      include: {
        leadCategory: {
          select: {
            id: true,
            name: true,
          },
        },
        leadSubCategory: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Also create/update corresponding contact
    try {
      await prisma.contact.upsert({
        where: {
          vendorId_mobileNumber: {
            vendorId,
            mobileNumber: mobile_number.trim(),
          },
        },
        update: {
          companyName: company_name?.trim() || lead.companyName || "",
          categoryId: category_id ? parseInt(category_id) : null,
          subCategoryId: subcategory_id ? parseInt(subcategory_id) : null,
          salesPersonName: finalSalesPersonName || lead.salesPersonName || null,
          status: status === "converted" ? "active" : status === "lost" ? "closed" : "pending",
          updatedAt: new Date(),
        },
        create: {
          vendorId,
          companyName: company_name?.trim() || "",
          mobileNumber: mobile_number.trim(),
          categoryId: category_id ? parseInt(category_id) : null,
          subCategoryId: subcategory_id ? parseInt(subcategory_id) : null,
          salesPersonName: finalSalesPersonName || null,
          status: status === "converted" ? "active" : status === "lost" ? "closed" : "pending",
        },
      });
    } catch (contactError) {
      // Log error but don't fail the lead creation
      console.error("Failed to create/update contact:", contactError);
    }

    return {
      success: true,
      lead: {
        id: lead.id,
        company_name: lead.companyName || "",
        mobile_number: lead.phoneNumber,
        email: lead.email || "",
        city: lead.city || "",
        category: lead.categoryId,
        category_name: lead.leadCategory?.name,
        sub_category: lead.subCategoryId,
        sub_category_name: lead.leadSubCategory?.name,
        sales_person_name: lead.salesPersonName,
        status: lead.status,
        created_at: lead.createdAt.toISOString(),
      },
    };
  }

  /**
   * Bulk create leads
   */
  static async bulkCreate(user, leadsData) {
    if (!Array.isArray(leadsData) || leadsData.length === 0) {
      throw new Error("Leads data is required");
    }

    const results = [];
    const errors = [];

    for (let i = 0; i < leadsData.length; i++) {
      const leadData = leadsData[i];
      try {
        const result = await this.create(user, leadData);
        results.push(result.lead);
      } catch (error) {
        errors.push({
          index: i,
          data: leadData,
          error: error.message,
        });
      }
    }

    return {
      success: true,
      created: results.length,
      failed: errors.length,
      leads: results,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  /**
   * Update a lead
   */
  static async update(user, id, data) {
    const vendorId = user.vendorId;
    const where = {
      id,
      vendorId,
      deletedAt: null,
    };

    // 🔒 ROLE-BASED PROTECTION
    if (user.role === "sales") {
      where.salesPersonName = user.name;
    }

    const lead = await prisma.lead.findFirst({
      where,
    });

    if (!lead) {
      throw new Error("Lead not found or unauthorized");
    }

    const updateData = {};

    if (data.company_name !== undefined) {
      updateData.companyName = data.company_name.trim() || null;
    }
    if (data.mobile_number !== undefined) {
      updateData.phoneNumber = data.mobile_number.trim();
    }
    if (data.email !== undefined) {
      updateData.email = data.email?.trim() || null;
    }
    if (data.city !== undefined) {
      updateData.city = data.city?.trim() || null;
    }
    if (data.category_id !== undefined) {
      updateData.categoryId = data.category_id ? parseInt(data.category_id) : null;
    }
    if (data.subcategory_id !== undefined) {
      updateData.subCategoryId = data.subcategory_id ? parseInt(data.subcategory_id) : null;
    }

    // 🛡️ Sales person cannot re-assign their own lead to someone else
    if (data.sales_person_name !== undefined && user.role !== "sales") {
      updateData.salesPersonName = data.sales_person_name?.trim() || null;
    }

    if (data.status !== undefined) {
      updateData.status = data.status;
    }

    const updated = await prisma.lead.update({
      where: {
        id,
      },
      data: updateData,
      include: {
        leadCategory: {
          select: {
            id: true,
            name: true,
          },
        },
        leadSubCategory: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // 🔥 Log Activity if status changed
    if (data.status && data.status !== lead.status) {
      await logActivity({
        vendorId,
        type: "Lead",
        event: "Status Updated",
        status: data.status,
        phoneNumber: lead.phoneNumber,
        payload: {
          leadId: id,
          oldStatus: lead.status,
          newStatus: data.status,
          updatedBy: user.name,
          companyName: lead.companyName
        }
      });
    }

    // Sync updated lead to contact
    if (updated.phoneNumber) {
      try {
        await prisma.contact.upsert({
          where: {
            vendorId_mobileNumber: {
              vendorId,
              mobileNumber: updated.phoneNumber,
            },
          },
          update: {
            companyName: updated.companyName || "",
            categoryId: updated.categoryId,
            subCategoryId: updated.subCategoryId,
            salesPersonName: updated.salesPersonName || null,
            status: updated.status === "converted" ? "active" : updated.status === "lost" ? "closed" : "pending",
            updatedAt: new Date(),
          },
          create: {
            vendorId,
            companyName: updated.companyName || "",
            mobileNumber: updated.phoneNumber,
            categoryId: updated.categoryId,
            subCategoryId: updated.subCategoryId,
            salesPersonName: updated.salesPersonName || null,
            status: updated.status === "converted" ? "active" : updated.status === "lost" ? "closed" : "pending",
          },
        });
      } catch (contactError) {
        console.error("Failed to sync updated lead to contact:", contactError);
      }
    }

    return {
      success: true,
      lead: {
        id: updated.id,
        company_name: updated.companyName || "",
        mobile_number: updated.phoneNumber,
        email: updated.email || "",
        city: updated.city || "",
        category: updated.categoryId,
        category_name: updated.leadCategory?.name,
        sub_category: updated.subCategoryId,
        sub_category_name: updated.leadSubCategory?.name,
        sales_person_name: updated.salesPersonName,
        status: updated.status,
        created_at: updated.createdAt.toISOString(),
      },
    };
  }

  /**
   * Bulk update leads
   */
  static async bulkUpdate(user, leadIds, data) {
    const vendorId = user.vendorId;
    if (!Array.isArray(leadIds) || leadIds.length === 0) {
      throw new Error("Lead IDs are required");
    }

    const updateData = {};

    // 🛡️ ROLE-BASED PROTECTION: Sales person cannot re-assign
    if (data.sales_person_name !== undefined && user.role !== "sales") {
      updateData.salesPersonName = data.sales_person_name?.trim() || null;
    }

    if (data.category_id !== undefined) {
      updateData.categoryId = data.category_id ? parseInt(data.category_id) : null;
    }
    if (data.subcategory_id !== undefined) {
      updateData.subCategoryId = data.subcategory_id ? parseInt(data.subcategory_id) : null;
    }
    if (data.status !== undefined) {
      updateData.status = data.status;
    }

    const where = {
      id: { in: leadIds },
      vendorId,
      deletedAt: null,
    };

    if (user.role === "sales") {
      where.salesPersonName = user.name;
    }

    const result = await prisma.lead.updateMany({
      where,
      data: updateData,
    });

    return {
      success: true,
      updated: result.count,
      message: `${result.count} lead(s) updated successfully`,
    };
  }

  /**
   * Delete a lead (hard delete)
   */
  static async delete(user, id) {
    const vendorId = user.vendorId;
    const where = {
      id,
      vendorId,
    };

    if (user.role === "sales") {
      where.salesPersonName = user.name;
    }

    const lead = await prisma.lead.findFirst({
      where,
    });

    if (!lead) {
      throw new Error("Lead not found or unauthorized");
    }

    const deleteResult = await prisma.lead.delete({
      where: {
        id,
      },
    });

    // Also delete contact
    if (lead.phoneNumber) {
      try {
        await prisma.contact.deleteMany({
          where: {
            vendorId,
            mobileNumber: lead.phoneNumber,
          },
        });
      } catch (contactError) {
        console.error('⚠️ Failed to delete contact:', contactError.message);
      }
    }

    return {
      success: true,
      message: "Lead deleted successfully",
    };
  }

  /**
   * Bulk delete leads
   */
  static async bulkDelete(user, leadIds) {
    const vendorId = user.vendorId;
    if (!Array.isArray(leadIds) || leadIds.length === 0) {
      throw new Error("Lead IDs are required");
    }

    const where = {
      id: { in: leadIds },
      vendorId,
    };

    if (user.role === "sales") {
      where.salesPersonName = user.name;
    }

    const leadsToDelete = await prisma.lead.findMany({
      where,
      select: {
        phoneNumber: true,
      },
    });

    const phoneNumbers = leadsToDelete.map(l => l.phoneNumber).filter(Boolean);

    const result = await prisma.lead.deleteMany({
      where,
    });

    if (phoneNumbers.length > 0) {
      try {
        await prisma.contact.deleteMany({
          where: {
            vendorId,
            mobileNumber: {
              in: phoneNumbers,
            },
          },
        });
      } catch (contactError) {
        console.error('⚠️ Failed to delete contacts:', contactError.message);
      }
    }

    return {
      success: true,
      deleted: result.count,
      message: `${result.count} lead(s) deleted successfully`,
    };
  }
}

export default LeadManagementService;
