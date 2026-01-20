import prisma from "../prisma.js";

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
  static async list(vendorId, filters = {}) {
    const { category_id, subcategory_id, status } = filters;

    const where = {
      vendorId,
    };

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
  static async getById(vendorId, id) {
    const lead = await prisma.lead.findFirst({
      where: {
        id,
        vendorId,
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
  static async create(vendorId, data) {
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
        salesPersonName: sales_person_name?.trim() || null,
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
          salesPersonName: sales_person_name?.trim() || lead.salesPersonName || null,
          status: status === "converted" ? "active" : status === "lost" ? "closed" : "pending",
          updatedAt: new Date(),
        },
        create: {
          vendorId,
          companyName: company_name?.trim() || "",
          mobileNumber: mobile_number.trim(),
          categoryId: category_id ? parseInt(category_id) : null,
          subCategoryId: subcategory_id ? parseInt(subcategory_id) : null,
          salesPersonName: sales_person_name?.trim() || null,
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
  static async bulkCreate(vendorId, leadsData) {
    if (!Array.isArray(leadsData) || leadsData.length === 0) {
      throw new Error("Leads data is required");
    }

    const results = [];
    const errors = [];

    for (let i = 0; i < leadsData.length; i++) {
      const leadData = leadsData[i];
      try {
        const result = await this.create(vendorId, leadData);
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
   * Helper method to sync lead to contact (used internally)
   */
  static async syncLeadToContact(vendorId, leadData) {
    const {
      company_name,
      mobile_number,
      category_id,
      subcategory_id,
      sales_person_name,
      status = "new",
    } = leadData;

    if (!mobile_number) {
      return; // Skip if no mobile number
    }

    try {
      await prisma.contact.upsert({
        where: {
          vendorId_mobileNumber: {
            vendorId,
            mobileNumber: mobile_number.trim(),
          },
        },
        update: {
          companyName: company_name?.trim() || "",
          categoryId: category_id ? parseInt(category_id) : null,
          subCategoryId: subcategory_id ? parseInt(subcategory_id) : null,
          salesPersonName: sales_person_name?.trim() || null,
          status: status === "converted" ? "active" : status === "lost" ? "closed" : "pending",
          updatedAt: new Date(),
        },
        create: {
          vendorId,
          companyName: company_name?.trim() || "",
          mobileNumber: mobile_number.trim(),
          categoryId: category_id ? parseInt(category_id) : null,
          subCategoryId: subcategory_id ? parseInt(subcategory_id) : null,
          salesPersonName: sales_person_name?.trim() || null,
          status: status === "converted" ? "active" : status === "lost" ? "closed" : "pending",
        },
      });
    } catch (error) {
      console.error("Failed to sync lead to contact:", error);
      // Don't throw - allow lead creation to continue even if contact sync fails
    }
  }

  /**
   * Update a lead
   */
  static async update(vendorId, id, data) {
    const lead = await prisma.lead.findFirst({
      where: {
        id,
        vendorId,
        deletedAt: null,
      },
    });

    if (!lead) {
      throw new Error("Lead not found");
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
    if (data.sales_person_name !== undefined) {
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
   * Bulk update leads (e.g., update sales person for multiple leads)
   */
  static async bulkUpdate(vendorId, leadIds, data) {
    if (!Array.isArray(leadIds) || leadIds.length === 0) {
      throw new Error("Lead IDs are required");
    }

    const updateData = {};

    if (data.sales_person_name !== undefined) {
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

    // Get leads to sync to contacts
    const leads = await prisma.lead.findMany({
      where: {
        id: {
          in: leadIds,
        },
        vendorId,
        deletedAt: null,
      },
      select: {
        id: true,
        phoneNumber: true,
        companyName: true,
        categoryId: true,
        subCategoryId: true,
        salesPersonName: true,
        status: true,
      },
    });

    const result = await prisma.lead.updateMany({
      where: {
        id: {
          in: leadIds,
        },
        vendorId,
        deletedAt: null,
      },
      data: updateData,
    });

    // Sync updated leads to contacts
    for (const lead of leads) {
      try {
        // Get the updated lead data after update
        const updatedLead = await prisma.lead.findUnique({
          where: { id: lead.id },
          select: {
            companyName: true,
            categoryId: true,
            subCategoryId: true,
            salesPersonName: true,
            status: true,
          },
        });

        if (updatedLead) {
          await prisma.contact.upsert({
            where: {
              vendorId_mobileNumber: {
                vendorId,
                mobileNumber: lead.phoneNumber,
              },
            },
            update: {
              companyName: updatedLead.companyName || "",
              categoryId: updatedLead.categoryId,
              subCategoryId: updatedLead.subCategoryId,
              salesPersonName: updatedLead.salesPersonName || null,
              status: updatedLead.status === "converted" ? "active" : updatedLead.status === "lost" ? "closed" : "pending",
              updatedAt: new Date(),
            },
            create: {
              vendorId,
              companyName: updatedLead.companyName || "",
              mobileNumber: lead.phoneNumber,
              categoryId: updatedLead.categoryId,
              subCategoryId: updatedLead.subCategoryId,
              salesPersonName: updatedLead.salesPersonName || null,
              status: updatedLead.status === "converted" ? "active" : updatedLead.status === "lost" ? "closed" : "pending",
            },
          });
        }
      } catch (contactError) {
        console.error(`Failed to sync lead ${lead.id} to contact:`, contactError);
      }
    }

    return {
      success: true,
      updated: result.count,
      message: `${result.count} lead(s) updated successfully`,
    };
  }

  /**
   * Delete a lead (hard delete)
   */
  static async delete(vendorId, id) {
    console.log('🗑️ LeadManagementService.delete called with:', { vendorId, id });

    const lead = await prisma.lead.findFirst({
      where: {
        id,
        vendorId,
      },
    });

    console.log('🔍 Found lead:', lead);

    if (!lead) {
      throw new Error("Lead not found");
    }

    console.log('🗑️ Attempting to delete lead with id:', id);

    const deleteResult = await prisma.lead.delete({
      where: {
        id,
      },
    });

    console.log('✅ Lead delete result:', deleteResult);

    // Also delete the corresponding contact if it exists
    if (lead.phoneNumber) {
      console.log('🗑️ Attempting to delete corresponding contact with phone:', lead.phoneNumber);
      try {
        const contactDeleteResult = await prisma.contact.deleteMany({
          where: {
            vendorId,
            mobileNumber: lead.phoneNumber,
          },
        });
        console.log('✅ Contact delete result:', contactDeleteResult.count, 'contacts deleted');
      } catch (contactError) {
        console.error('⚠️ Failed to delete contact:', contactError.message);
        // Don't fail the lead deletion if contact deletion fails
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
  static async bulkDelete(vendorId, leadIds) {
    if (!Array.isArray(leadIds) || leadIds.length === 0) {
      throw new Error("Lead IDs are required");
    }

    console.log('🗑️ LeadManagementService.bulkDelete called with:', { vendorId, leadIds });

    // First, get the phone numbers of the leads to delete
    const leadsToDelete = await prisma.lead.findMany({
      where: {
        id: {
          in: leadIds,
        },
        vendorId,
      },
      select: {
        phoneNumber: true,
      },
    });

    const phoneNumbers = leadsToDelete.map(l => l.phoneNumber).filter(Boolean);
    console.log('📞 Phone numbers to delete contacts for:', phoneNumbers);

    // Delete the leads
    const result = await prisma.lead.deleteMany({
      where: {
        id: {
          in: leadIds,
        },
        vendorId,
      },
    });

    console.log('✅ Deleted leads:', result.count);

    // Also delete corresponding contacts
    if (phoneNumbers.length > 0) {
      try {
        const contactDeleteResult = await prisma.contact.deleteMany({
          where: {
            vendorId,
            mobileNumber: {
              in: phoneNumbers,
            },
          },
        });
        console.log('✅ Deleted contacts:', contactDeleteResult.count);
      } catch (contactError) {
        console.error('⚠️ Failed to delete contacts:', contactError.message);
        // Don't fail the lead deletion if contact deletion fails
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

