import prisma from "../prisma.js";

class CategoryService {
  /**
   * Create a category or subcategory
   */
  static async create(vendorId, data) {
    const { category_name, subcategory_name, parent_id } = data;

    // If both category and subcategory are provided, create both
    if (category_name && subcategory_name) {
      // First, create or get the parent category
      let parentCategory = await prisma.category.findFirst({
        where: {
          vendorId,
          name: category_name.trim(),
          parentId: null,
        },
      });

      if (!parentCategory) {
        parentCategory = await prisma.category.create({
          data: {
            vendorId,
            name: category_name.trim(),
            parentId: null,
          },
        });
      }

      // Then create the subcategory
      const subcategory = await prisma.category.create({
        data: {
          vendorId,
          name: subcategory_name.trim(),
          parentId: parentCategory.id,
        },
      });

      return {
        success: true,
        category: parentCategory,
        subcategory,
      };
    }

    // If only category is provided
    if (category_name) {
      // Check if parent_id is provided (creating subcategory under existing category)
      if (parent_id) {
        // Verify parent exists and belongs to vendor
        const parent = await prisma.category.findFirst({
          where: {
            id: parseInt(parent_id),
            vendorId,
            parentId: null, // Ensure it's a main category, not a subcategory
          },
        });

        if (!parent) {
          throw new Error("Parent category not found");
        }

        const category = await prisma.category.create({
          data: {
            vendorId,
            name: category_name.trim(),
            parentId: parseInt(parent_id),
          },
        });

        return {
          success: true,
          category,
        };
      } else {
        // Create main category
        const category = await prisma.category.create({
          data: {
            vendorId,
            name: category_name.trim(),
            parentId: null,
          },
        });

        return {
          success: true,
          category,
        };
      }
    }

    throw new Error("Category name is required");
  }

  /**
   * List all categories with their subcategories
   */
  static async list(vendorId) {
    // Get all categories (both main and subcategories) for debugging
    const allCategories = await prisma.category.findMany({
      where: {
        vendorId,
      },
      orderBy: [
        { parentId: "asc" }, // Main categories first (parentId is null)
        { name: "asc" },
      ],
    });

    // Get only main categories (parentId is null) with their children
    const categories = await prisma.category.findMany({
      where: {
        vendorId,
        parentId: null, // Only get top-level categories
      },
      include: {
        children: {
          orderBy: {
            name: "asc",
          },
        },
        _count: {
          select: {
            children: true,
            contacts: true,
            galleryImages: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    // Get lead counts for each category and subcategory
    const categoryIds = categories.map((cat) => cat.id);
    const allSubcategoryIds = categories.flatMap((cat) => cat.children.map((sub) => sub.id));

    // Count leads per category (leads where categoryId matches)
    const categoryLeadCounts = await prisma.lead.groupBy({
      by: ["categoryId"],
      where: {
        vendorId,
        deletedAt: null,
        categoryId: { in: categoryIds },
      },
      _count: true,
    });

    // Count leads per subcategory (leads where subCategoryId matches)
    const subcategoryLeadCounts = await prisma.lead.groupBy({
      by: ["subCategoryId"],
      where: {
        vendorId,
        deletedAt: null,
        subCategoryId: { in: allSubcategoryIds },
      },
      _count: true,
    });

    // Create a map for lead counts
    const leadCountMap = new Map();
    categoryLeadCounts.forEach((count) => {
      if (count.categoryId) {
        leadCountMap.set(`cat_${count.categoryId}`, count._count);
      }
    });
    subcategoryLeadCounts.forEach((count) => {
      if (count.subCategoryId) {
        leadCountMap.set(`cat_${count.subCategoryId}`, count._count);
      }
    });

    // Transform to match frontend expectations
    return categories.map((cat) => {
      const leadCount = leadCountMap.get(`cat_${cat.id}`) || 0;
      return {
        id: cat.id,
        name: cat.name,
        parent: cat.parentId,
        subcategories: cat.children.map((sub) => {
          const subLeadCount = leadCountMap.get(`cat_${sub.id}`) || 0;
          return {
            id: sub.id,
            name: sub.name,
            parent: sub.parentId,
          };
        }),
        get_subcategories_count: cat._count.children,
        get_contacts_count: cat._count.contacts + leadCount, // Include leads in contact count
      };
    });
  }

  /**
   * Get category by ID with subcategories
   */
  static async getById(vendorId, id) {
    if (!id || isNaN(id)) {
      throw new Error("Invalid category ID");
    }

    const parsedId = parseInt(id);
    const category = await prisma.category.findFirst({
      where: {
        id: parsedId,
        vendorId,
      },
      include: {
        children: {
          orderBy: {
            name: "asc",
          },
        },
        parent: true,
        _count: {
          select: {
            children: true,
            contacts: true,
            galleryImages: true,
          },
        },
      },
    });

    if (!category) {
      return null;
    }

    return {
      id: category.id,
      name: category.name,
      parent: category.parentId,
      subcategories: category.children.map((sub) => ({
        id: sub.id,
        name: sub.name,
        parent: sub.parentId,
      })),
      get_subcategories_count: category._count.children,
      get_contacts_count: category._count.contacts,
    };
  }

  /**
   * Update category name
   */
  static async update(vendorId, id, data) {
    const { name } = data;

    if (!name || !name.trim()) {
      throw new Error("Category name is required");
    }

    const category = await prisma.category.findFirst({
      where: {
        id: parseInt(id),
        vendorId,
      },
    });

    if (!category) {
      throw new Error("Category not found");
    }

    // Check for duplicate name at the same level (same parentId)
    const existing = await prisma.category.findFirst({
      where: {
        vendorId,
        name: name.trim(),
        parentId: category.parentId, // Same parent level
        id: {
          not: parseInt(id),
        },
      },
    });

    if (existing) {
      throw new Error("Category with this name already exists at this level");
    }

    const updated = await prisma.category.update({
      where: {
        id: parseInt(id),
      },
      data: {
        name: name.trim(),
      },
    });

    return {
      success: true,
      category: updated,
    };
  }

  /**
   * Delete category with cascade options
   */
  static async delete(vendorId, id, options = {}) {
    console.log('🗑️ CategoryService.delete called with:', { vendorId, id, options });

    const category = await prisma.category.findFirst({
      where: {
        id: parseInt(id),
        vendorId,
      },
      include: {
        children: true,
        _count: {
          select: {
            children: true,
            contacts: true,
            galleryImages: true,
          },
        },
      },
    });

    console.log('🔍 Found category:', category);

    if (!category) {
      throw new Error("Category not found");
    }

    const {
      delete_subcategories = false,
      delete_gallery = false,
      delete_contacts = false,
      delete_leads = false,
    } = options;

    // Check for leads associated with this category
    const leadsCount = await prisma.lead.count({
      where: {
        vendorId,
        OR: [
          { categoryId: parseInt(id) },
          { subCategoryId: parseInt(id) },
        ],
      },
    });

    console.log('📊 Leads count:', leadsCount);

    // Check if category has data
    const hasData =
      category._count.children > 0 ||
      category._count.contacts > 0 ||
      category._count.galleryImages > 0 ||
      leadsCount > 0;

    console.log('📊 Has data:', hasData, {
      children: category._count.children,
      contacts: category._count.contacts,
      galleryImages: category._count.galleryImages,
      leads: leadsCount
    });

    if (hasData && !delete_subcategories && !delete_gallery && !delete_contacts && !delete_leads) {
      console.log('⚠️ Returning cascade requirement');
      return {
        requires_cascade: true,
        images_count: category._count.galleryImages,
        contacts_count: category._count.contacts,
        leads_count: leadsCount,
        subcategories_count: category._count.children,
      };
    }

    // Delete subcategories if requested
    if (delete_subcategories && category._count.children > 0) {
      console.log('🗑️ Deleting subcategories...');
      await prisma.category.deleteMany({
        where: {
          parentId: parseInt(id),
          vendorId,
        },
      });
    }

    // Delete gallery images if requested
    if (delete_gallery && category._count.galleryImages > 0) {
      console.log('🗑️ Deleting gallery images...');

      // Fetch images to get S3 keys
      const imagesToDelete = await prisma.galleryImage.findMany({
        where: {
          OR: [
            { categoryId: parseInt(id) },
            { subCategoryId: parseInt(id) },
          ],
          vendorId,
        },
        select: { s3Key: true }
      });

      // Delete from S3
      const s3Keys = imagesToDelete.filter(img => img.s3Key).map(img => img.s3Key);
      if (s3Keys.length > 0) {
        console.log(`🗑️ Deleting ${s3Keys.length} images from S3`);
        const { deleteMultipleFromS3 } = await import("../utils/s3.util.js");
        await deleteMultipleFromS3(s3Keys);
      }

      await prisma.galleryImage.deleteMany({
        where: {
          OR: [
            { categoryId: parseInt(id) },
            { subCategoryId: parseInt(id) },
          ],
          vendorId,
        },
      });
    }

    // Delete contacts if requested
    if (delete_contacts && category._count.contacts > 0) {
      console.log('🗑️ Deleting contacts...');
      // First get the contacts to find their phone numbers
      const contactsToDelete = await prisma.contact.findMany({
        where: {
          OR: [
            { categoryId: parseInt(id) },
            { subCategoryId: parseInt(id) },
          ],
          vendorId,
        },
        select: { mobileNumber: true }
      });

      const phoneNumbers = contactsToDelete.map(c => c.mobileNumber);
      console.log('📞 Phone numbers to delete leads for:', phoneNumbers);

      // Delete the contacts
      const contactDeleteResult = await prisma.contact.deleteMany({
        where: {
          OR: [
            { categoryId: parseInt(id) },
            { subCategoryId: parseInt(id) },
          ],
          vendorId,
        },
      });
      console.log('✅ Deleted contacts:', contactDeleteResult.count);

      // Also delete leads with same phone numbers if delete_contacts is true
      if (phoneNumbers.length > 0) {
        const leadDeleteResult = await prisma.lead.deleteMany({
          where: {
            vendorId,
            phoneNumber: { in: phoneNumbers }
          }
        });
        console.log('✅ Deleted leads by phone number:', leadDeleteResult.count);
      }
    }

    // Explicitly delete leads if requested (for leads that might not match a contact but match category)
    if (delete_leads && leadsCount > 0) {
      console.log('🗑️ Explicitly deleting leads by category...');
      const leadDeleteResult = await prisma.lead.deleteMany({
        where: {
          vendorId,
          OR: [
            { categoryId: parseInt(id) },
            { subCategoryId: parseInt(id) },
          ],
        },
      });
      console.log('✅ Deleted leads by category:', leadDeleteResult.count);
    }

    // Delete the category
    console.log('🗑️ Deleting category...');
    const categoryDeleteResult = await prisma.category.delete({
      where: {
        id: parseInt(id),
      },
    });
    console.log('✅ Category deleted:', categoryDeleteResult);

    return {
      success: true,
      message: "Category deleted successfully",
    };
  }

  /**
   * Get contacts for a category/subcategory
   * Also includes leads with the same category/subcategory
   */
  static async getContacts(vendorId, categoryId = null, subcategoryId = null) {
    const where = {
      vendorId,
    };

    // Add category filters if valid IDs are provided
    if (subcategoryId && !isNaN(subcategoryId)) {
      where.subCategoryId = parseInt(subcategoryId);
    } else if (categoryId && !isNaN(categoryId)) {
      where.categoryId = parseInt(categoryId);
    }
    // If no filters provided, we'll get ALL contacts (no additional where clause needed)

    // Get contacts
    const contacts = await prisma.contact.findMany({
      where,
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        subCategory: {
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

    // Also get leads with same category/subcategory (non-deleted)
    let leads = [];

    if (subcategoryId && !isNaN(subcategoryId)) {
      // If filtering by subcategory, get leads with this specific subcategory
      leads = await prisma.lead.findMany({
        where: {
          vendorId,
          deletedAt: null,
          subCategoryId: parseInt(subcategoryId),
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
        orderBy: {
          createdAt: "desc",
        },
      });
    } else if (categoryId && !isNaN(categoryId)) {
      // If filtering by category, get leads with this category OR any subcategory under it
      // First get all subcategory IDs for this category
      const parsedCategoryId = parseInt(categoryId);
      const subcats = await prisma.category.findMany({
        where: {
          vendorId,
          parentId: parsedCategoryId,
        },
        select: { id: true },
      });
      const subcatIds = subcats.map((sub) => sub.id);

      // Get leads with this category OR any of its subcategories
      leads = await prisma.lead.findMany({
        where: {
          vendorId,
          deletedAt: null,
          OR: [
            { categoryId: parsedCategoryId },
            ...(subcatIds.length > 0 ? [{ subCategoryId: { in: subcatIds } }] : []),
          ],
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
        orderBy: {
          createdAt: "desc",
        },
      });
    } else {
      // No filter - get ALL leads for this vendor
      leads = await prisma.lead.findMany({
        where: {
          vendorId,
          deletedAt: null,
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
        orderBy: {
          createdAt: "desc",
        },
      });
    }


    // Combine contacts and leads, avoiding duplicates by mobile number
    const contactMap = new Map();

    // Add contacts first
    contacts.forEach((contact) => {
      contactMap.set(contact.mobileNumber, {
        id: contact.id,
        company_name: contact.companyName,
        mobile_number: contact.mobileNumber,
        category: contact.categoryId,
        category_name: contact.category?.name,
        sub_category: contact.subCategoryId,
        sub_category_name: contact.subCategory?.name,
        sales_person_name: contact.salesPersonName,
        status: contact.status,
        assigned_to: contact.assignedTo,
        created_at: contact.createdAt.toISOString(),
        is_lead: false,
      });
    });

    // Add leads (will override contacts if same mobile number, since leads are newer)
    leads.forEach((lead) => {
      contactMap.set(lead.phoneNumber, {
        id: lead.id,
        company_name: lead.companyName || "",
        mobile_number: lead.phoneNumber,
        category: lead.categoryId,
        category_name: lead.leadCategory?.name,
        sub_category: lead.subCategoryId,
        sub_category_name: lead.leadSubCategory?.name,
        sales_person_name: lead.salesPersonName,
        status: lead.status || "new", // Return actual lead status
        assigned_to: null,
        created_at: lead.createdAt.toISOString(),
        is_lead: true,
      });
    });

    const combinedContacts = Array.from(contactMap.values());

    return {
      count: combinedContacts.length,
      contacts: combinedContacts,
    };
  }

  /**
   * Create a contact
   */
  static async createContact(vendorId, data) {
    const {
      company_name,
      mobile_number,
      category_id,
      subcategory_id,
      sales_person_name,
      status = "pending",
    } = data;

    if (!company_name || !mobile_number || !category_id) {
      throw new Error("Company name, mobile number, and category are required");
    }

    // Check if contact already exists
    const existing = await prisma.contact.findFirst({
      where: {
        vendorId,
        mobileNumber: mobile_number.trim(),
      },
    });

    if (existing) {
      throw new Error("Contact with this mobile number already exists");
    }

    // Verify category exists and belongs to vendor
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

    // Verify subcategory exists and belongs to vendor and parent category
    if (subcategory_id) {
      const subcategory = await prisma.category.findFirst({
        where: {
          id: parseInt(subcategory_id),
          vendorId,
          parentId: parseInt(category_id),
        },
      });

      if (!subcategory) {
        throw new Error("Subcategory not found or does not belong to the selected category");
      }
    }

    const contact = await prisma.contact.create({
      data: {
        vendorId,
        companyName: company_name.trim(),
        mobileNumber: mobile_number.trim(),
        categoryId: parseInt(category_id),
        subCategoryId: subcategory_id ? parseInt(subcategory_id) : null,
        salesPersonName: sales_person_name?.trim() || null,
        status: status,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        subCategory: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return {
      success: true,
      contact: {
        id: contact.id,
        company_name: contact.companyName,
        mobile_number: contact.mobileNumber,
        category: contact.categoryId,
        category_name: contact.category?.name,
        sub_category: contact.subCategoryId,
        sub_category_name: contact.subCategory?.name,
        sales_person_name: contact.salesPersonName,
        status: contact.status,
        created_at: contact.createdAt.toISOString(),
      },
    };
  }

  /**
   * Update a contact
   */
  static async updateContact(vendorId, id, data) {
    const contact = await prisma.contact.findFirst({
      where: {
        id: parseInt(id),
        vendorId,
      },
    });

    if (!contact) {
      throw new Error("Contact not found");
    }

    const updateData = {};

    if (data.status !== undefined) {
      updateData.status = data.status;
    }
    if (data.company_name !== undefined) {
      updateData.companyName = data.company_name.trim();
    }
    if (data.mobile_number !== undefined) {
      updateData.mobileNumber = data.mobile_number.trim();
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

    const updated = await prisma.contact.update({
      where: {
        id: parseInt(id),
      },
      data: updateData,
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        subCategory: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return {
      success: true,
      contact: {
        id: updated.id,
        company_name: updated.companyName,
        mobile_number: updated.mobileNumber,
        category: updated.categoryId,
        category_name: updated.category?.name,
        sub_category: updated.subCategoryId,
        sub_category_name: updated.subCategory?.name,
        sales_person_name: updated.salesPersonName,
        status: updated.status,
        created_at: updated.createdAt.toISOString(),
      },
    };
  }

  /**
   * Delete a contact
   */
  static async deleteContact(vendorId, id) {
    const contact = await prisma.contact.findFirst({
      where: {
        id: parseInt(id),
        vendorId,
      },
    });

    if (!contact) {
      throw new Error("Contact not found");
    }

    await prisma.contact.delete({
      where: {
        id: parseInt(id),
      },
    });

    return {
      success: true,
      message: "Contact deleted successfully",
    };
  }

  /**
   * Debug: Get all categories (including subcategories) - for testing
   */
  static async getAllCategories(vendorId) {
    const allCategories = await prisma.category.findMany({
      where: {
        vendorId,
      },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
          },
        },
        children: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            children: true,
            contacts: true,
            galleryImages: true,
          },
        },
      },
      orderBy: [
        { parentId: "asc" }, // Main categories first (parentId is null)
        { name: "asc" },
      ],
    });

    return allCategories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      parentId: cat.parentId,
      parentName: cat.parent?.name || null,
      isMainCategory: cat.parentId === null,
      isSubcategory: cat.parentId !== null,
      subcategoriesCount: cat._count.children,
      contactsCount: cat._count.contacts,
      galleryImagesCount: cat._count.galleryImages,
      children: cat.children.map((child) => ({
        id: child.id,
        name: child.name,
      })),
    }));
  }
}

export default CategoryService;
