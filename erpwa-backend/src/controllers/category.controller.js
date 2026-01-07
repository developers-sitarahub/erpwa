import CategoryService from "../services/category.service.js";

class CategoryController {
  /**
   * Create category or subcategory
   * POST /api/categories
   */
  static async create(req, res) {
    try {
      const result = await CategoryService.create(req.user.vendorId, req.body);
      res.json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  /**
   * List all categories with subcategories
   * GET /api/categories
   */
  static async list(req, res) {
    try {
      const categories = await CategoryService.list(req.user.vendorId);
      res.json({ data: categories });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  /**
   * Get category by ID
   * GET /api/categories/:id
   */
  static async getById(req, res) {
    try {
      const id = req.params.id;

      if (!id) {
        return res.status(400).json({ error: "Category ID is required" });
      }

      const parsedId = parseInt(id);
      if (isNaN(parsedId)) {
        return res.status(400).json({ error: "Invalid category ID" });
      }

      const category = await CategoryService.getById(
        req.user.vendorId,
        parsedId
      );

      if (!category) {
        return res.status(404).json({ error: "Category not found" });
      }

      res.json({ data: category });
    } catch (err) {
      console.error("Error in getById:", err);
      res.status(400).json({ error: err.message });
    }
  }

  /**
   * Update category
   * PUT /api/categories/:id
   */
  static async update(req, res) {
    try {
      const result = await CategoryService.update(
        req.user.vendorId,
        req.params.id,
        req.body
      );
      res.json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  /**
   * Delete category
   * DELETE /api/categories/:id
   */
  static async delete(req, res) {
    try {
      const options = {
        delete_subcategories: req.query.delete_subcategories === "true",
        delete_gallery: req.query.delete_gallery === "true",
        delete_contacts: req.query.delete_contacts === "true",
        delete_leads: req.query.delete_leads === "true",
      };

      const result = await CategoryService.delete(
        req.user.vendorId,
        req.params.id,
        options
      );

      if (result.requires_cascade) {
        return res.status(400).json(result);
      }

      res.json(result);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * Get contacts for a category/subcategory
   * GET /api/categories/:id/contacts
   * GET /api/categories/contacts?category_id=1&subcategory_id=2
   */
  static async getContacts(req, res) {
    try {
      const categoryId = req.params.id || req.query.category_id;
      const subcategoryId = req.query.subcategory_id;

      // If no category or subcategory provided, we'll get ALL contacts (no validation needed here)
      // The service already handles this logic.

      // Validate categoryId and subcategoryId if provided
      let parsedCategoryId = null;
      let parsedSubcategoryId = null;

      if (categoryId) {
        parsedCategoryId = parseInt(categoryId);
        if (isNaN(parsedCategoryId)) {
          return res.status(400).json({ error: "Invalid category ID" });
        }
      }

      if (subcategoryId) {
        parsedSubcategoryId = parseInt(subcategoryId);
        if (isNaN(parsedSubcategoryId)) {
          return res.status(400).json({ error: "Invalid subcategory ID" });
        }
      }

      const result = await CategoryService.getContacts(
        req.user.vendorId,
        parsedCategoryId,
        parsedSubcategoryId
      );

      res.json({ data: result });
    } catch (err) {
      console.error("Error in getContacts:", err);
      res.status(400).json({ error: err.message });
    }
  }

  /**
   * Create a contact
   * POST /api/categories/contacts
   */
  static async createContact(req, res) {
    try {
      const result = await CategoryService.createContact(
        req.user.vendorId,
        req.body
      );
      res.json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  /**
   * Update a contact
   * PUT /api/categories/contacts/:id
   */
  static async updateContact(req, res) {
    try {
      const result = await CategoryService.updateContact(
        req.user.vendorId,
        req.params.id,
        req.body
      );
      res.json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  /**
   * Delete a contact
   * DELETE /api/categories/contacts/:id
   */
  static async deleteContact(req, res) {
    try {
      const result = await CategoryService.deleteContact(
        req.user.vendorId,
        req.params.id
      );
      res.json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  /**
   * Debug: Get all categories (including subcategories) - for testing
   * GET /api/categories/debug/all
   */
  static async getAllCategories(req, res) {
    try {
      const result = await CategoryService.getAllCategories(req.user.vendorId);
      res.json({ data: result });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }
}

export default CategoryController;

