import prisma from "../prisma.js";

class GalleryService {
  /**
   * List gallery images with optional filtering and pagination
   */
  static async list(vendorId, filters = {}, pagination = {}) {
    const { category_id, subcategory_id, sort_by, sort_order, filter_by, filter_value } = filters;
    const { page = 1, limit = 20 } = pagination;

    const where = {
      vendorId,
    };

    if (subcategory_id) {
      where.subCategoryId = parseInt(subcategory_id);
    } else if (category_id) {
      where.categoryId = parseInt(category_id);
    }

    // Apply additional filters
    // Apply additional filters
    if (filter_by) {
      if (filter_by === 'price') {
        if (filter_value) {
          const price = parseFloat(filter_value);
          if (!isNaN(price)) {
            where.price = price;
          }
        } else {
          // Filter for items that have a price (not null)
          where.price = { not: null };
        }
      } else if (filter_by === 'description') {
        if (filter_value) {
          where.description = {
            contains: filter_value,
            mode: 'insensitive',
          };
        } else {
          // Filter for items that have a description (not null and not empty)
          where.description = {
            not: null,
            // Note: Prisma doesn't support checking for empty string easily in the same query for nullable fields in all DBs,
            // but usually description is either null or has content.
            // If needed we can add AND: [{ description: { not: null } }, { description: { not: "" } }]
          };
        }
      }
    }

    // Determine sorting
    let orderBy = { createdAt: "desc" }; // Default
    if (sort_by) {
      const order = sort_order === 'asc' ? 'asc' : 'desc';
      if (sort_by === 'price') {
        orderBy = { price: order };
      } else if (sort_by === 'name' || sort_by === 'title') {
        orderBy = { title: order };
      } else if (sort_by === 'modified' || sort_by === 'updatedAt') {
        orderBy = { updatedAt: order };
      } else if (sort_by === 'createdAt') {
        orderBy = { createdAt: order };
      }
    }

    const skip = (page - 1) * limit;

    const [images, total] = await Promise.all([
      prisma.galleryImage.findMany({
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
        orderBy,
        skip,
        take: limit,
      }),
      prisma.galleryImage.count({ where }),
    ]);

    const formattedImages = images.map((img) => {
      const imageUrl = img.s3Url;

      return {
        id: img.id,
        image_url: imageUrl,
        url: imageUrl,
        s3_url: imageUrl,
        image: { url: imageUrl },
        title: img.title,
        description: img.description,
        price: img.price,
        price_currency: img.priceCurrency || "USD",
        price_display: img.price
          ? `${img.priceCurrency || "USD"} ${img.price.toFixed(2)}`
          : null,
        get_display_price: img.price
          ? `${img.priceCurrency || "USD"} ${img.price.toFixed(2)}`
          : null,
        category: img.categoryId,
        category_name: img.category?.name,
        sub_category: img.subCategoryId,
        sub_category_name: img.subCategory?.name,
        created_at: img.createdAt.toISOString(),
        updated_at: img.updatedAt.toISOString(),
      };
    });

    return {
      images: formattedImages,
      total,
      page,
      limit,
      hasMore: skip + limit < total,
    };
  }

  /**
   * Get gallery image by ID
   */
  static async getById(vendorId, id) {
    const image = await prisma.galleryImage.findFirst({
      where: {
        id: parseInt(id),
        vendorId,
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

    if (!image) {
      return null;
    }

    return {
      id: image.id,
      image_url: image.s3Url,
      url: image.s3Url,
      s3_url: image.s3Url,
      image: { url: image.s3Url },
      title: image.title,
      description: image.description,
      price: image.price,
      price_currency: image.priceCurrency || "USD",
      price_display: image.price
        ? `${image.priceCurrency || "USD"} ${image.price.toFixed(2)}`
        : null,
      get_display_price: image.price
        ? `${image.priceCurrency || "USD"} ${image.price.toFixed(2)}`
        : null,
      category: image.categoryId,
      category_name: image.category?.name,
      sub_category: image.subCategoryId,
      sub_category_name: image.subCategory?.name,
      created_at: image.createdAt.toISOString(),
      updated_at: image.updatedAt.toISOString(),
    };
  }

  /**
   * Create a gallery image
   * Note: s3Url should be provided after uploading to S3
   */
  static async create(vendorId, data) {
    const {
      s3_url,
      title,
      description,
      price,
      price_currency = "USD",
      category_id,
      subcategory_id,
    } = data;

    if (!s3_url) {
      throw new Error("S3 URL is required");
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

    const image = await prisma.galleryImage.create({
      data: {
        vendorId,
        s3Url: s3_url,
        s3Key: data.s3_key || null,
        title: title?.trim() || null,
        description: description?.trim() || null,
        price: price ? parseFloat(price) : null,
        priceCurrency: price_currency || "USD",
        categoryId: category_id ? parseInt(category_id) : null,
        subCategoryId: subcategory_id ? parseInt(subcategory_id) : null,
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
      image: {
        id: image.id,
        image_url: image.s3Url,
        url: image.s3Url,
        s3_url: image.s3Url,
        image: { url: image.s3Url },
        title: image.title,
        description: image.description,
        price: image.price,
        price_currency: image.priceCurrency || "USD",
        price_display: image.price
          ? `${image.priceCurrency || "USD"} ${image.price.toFixed(2)}`
          : null,
        get_display_price: image.price
          ? `${image.priceCurrency || "USD"} ${image.price.toFixed(2)}`
          : null,
        category: image.categoryId,
        category_name: image.category?.name,
        sub_category: image.subCategoryId,
        sub_category_name: image.subCategory?.name,
        created_at: image.createdAt.toISOString(),
        updated_at: image.updatedAt.toISOString(),
      },
    };
  }

  /**
   * Bulk create gallery images
   */
  static async bulkCreate(vendorId, imagesData) {
    if (!Array.isArray(imagesData) || imagesData.length === 0) {
      throw new Error("Images data is required");
    }

    const results = [];
    const errors = [];

    for (let i = 0; i < imagesData.length; i++) {
      const imageData = imagesData[i];
      try {
        const result = await this.create(vendorId, imageData);
        results.push(result.image);
      } catch (error) {
        errors.push({
          index: i,
          data: imageData,
          error: error.message,
        });
      }
    }

    return {
      success: true,
      created: results.length,
      failed: errors.length,
      images: results,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  /**
   * Update a gallery image
   */
  static async update(vendorId, id, data) {
    const image = await prisma.galleryImage.findFirst({
      where: {
        id: parseInt(id),
        vendorId,
      },
    });

    if (!image) {
      throw new Error("Gallery image not found");
    }

    const updateData = {};

    if (data.title !== undefined) {
      updateData.title = data.title?.trim() || null;
    }
    if (data.description !== undefined) {
      updateData.description = data.description?.trim() || null;
    }
    if (data.price !== undefined) {
      updateData.price = data.price ? parseFloat(data.price) : null;
    }
    if (data.price_currency !== undefined) {
      updateData.priceCurrency = data.price_currency || "USD";
    }
    if (data.category_id !== undefined) {
      updateData.categoryId = data.category_id ? parseInt(data.category_id) : null;
    }
    if (data.subcategory_id !== undefined) {
      updateData.subCategoryId = data.subcategory_id ? parseInt(data.subcategory_id) : null;
    }

    const updated = await prisma.galleryImage.update({
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
      image: {
        id: updated.id,
        image_url: updated.s3Url,
        url: updated.s3Url,
        s3_url: updated.s3Url,
        image: { url: updated.s3Url },
        title: updated.title,
        description: updated.description,
        price: updated.price,
        price_currency: updated.priceCurrency || "USD",
        price_display: updated.price
          ? `${updated.priceCurrency || "USD"} ${updated.price.toFixed(2)}`
          : null,
        get_display_price: updated.price
          ? `${updated.priceCurrency || "USD"} ${updated.price.toFixed(2)}`
          : null,
        category: updated.categoryId,
        category_name: updated.category?.name,
        sub_category: updated.subCategoryId,
        sub_category_name: updated.subCategory?.name,
        created_at: updated.createdAt.toISOString(),
        updated_at: updated.updatedAt.toISOString(),
      },
    };
  }

  /**
   * Delete a gallery image
   */
  static async delete(vendorId, id) {
    console.log('🗑️ GalleryService.delete called with:', { vendorId, id, parsedId: parseInt(id) });

    const image = await prisma.galleryImage.findFirst({
      where: {
        id: parseInt(id),
        vendorId,
      },
    });

    console.log('🔍 Found image:', image);

    if (!image) {
      throw new Error("Gallery image not found");
    }

    // Delete from S3 if s3Key exists
    if (image.s3Key) {
      console.log('🗑️ Deleting from S3:', image.s3Key);
      const { deleteFromS3 } = await import("../utils/s3.util.js");
      await deleteFromS3(image.s3Key);
    }

    console.log('🗑️ Attempting to delete image from DB with id:', parseInt(id));

    const deleteResult = await prisma.galleryImage.delete({
      where: {
        id: parseInt(id),
      },
    });

    console.log('✅ Delete result:', deleteResult);

    return {
      success: true,
      message: "Gallery image deleted successfully",
    };
  }

  /**
   * Bulk delete gallery images
   */
  static async bulkDelete(vendorId, imageIds) {
    if (!Array.isArray(imageIds) || imageIds.length === 0) {
      throw new Error("Image IDs are required");
    }

    // First, get all images to retrieve S3 keys
    const images = await prisma.galleryImage.findMany({
      where: {
        id: {
          in: imageIds.map((id) => parseInt(id)),
        },
        vendorId,
      },
      select: {
        id: true,
        s3Key: true,
      },
    });

    // Delete from S3
    const s3Keys = images.filter(img => img.s3Key).map(img => img.s3Key);
    if (s3Keys.length > 0) {
      console.log(`🗑️ Deleting ${s3Keys.length} images from S3`);
      const { deleteMultipleFromS3 } = await import("../utils/s3.util.js");
      await deleteMultipleFromS3(s3Keys);
    }

    // Delete from database
    const result = await prisma.galleryImage.deleteMany({
      where: {
        id: {
          in: imageIds.map((id) => parseInt(id)),
        },
        vendorId,
      },
    });

    return {
      success: true,
      deleted: result.count,
      message: `${result.count} image(s) deleted successfully`,
    };
  }
}

export default GalleryService;



