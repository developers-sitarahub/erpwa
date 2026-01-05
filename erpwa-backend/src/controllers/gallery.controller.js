import GalleryService from "../services/gallery.service.js";

class GalleryController {
  /**
   * List gallery images with optional filtering and pagination
   * GET /api/gallery
   */
  static async list(req, res) {
    try {
      const filters = {
        category_id: req.query.category_id,
        subcategory_id: req.query.subcategory_id,
      };

      const pagination = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 20,
      };

      const result = await GalleryService.list(
        req.user.vendorId,
        filters,
        pagination
      );
      res.json({ data: result });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  /**
   * Get gallery image by ID
   * GET /api/gallery/:id
   */
  static async getById(req, res) {
    try {
      const image = await GalleryService.getById(
        req.user.vendorId,
        req.params.id
      );

      if (!image) {
        return res.status(404).json({ error: "Gallery image not found" });
      }

      res.json({ data: image });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  /**
   * Create a gallery image
   * POST /api/gallery
   */
  static async create(req, res) {
    try {
      const result = await GalleryService.create(
        req.user.vendorId,
        req.body
      );
      res.json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  /**
   * Bulk create gallery images
   * POST /api/gallery/bulk
   */
  static async bulkCreate(req, res) {
    try {
      const { images } = req.body;

      if (!Array.isArray(images) || images.length === 0) {
        return res.status(400).json({ error: "Images array is required" });
      }

      const result = await GalleryService.bulkCreate(
        req.user.vendorId,
        images
      );
      res.json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  /**
   * Update a gallery image
   * PUT /api/gallery/:id
   */
  static async update(req, res) {
    try {
      const result = await GalleryService.update(
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
   * Delete a gallery image
   * DELETE /api/gallery/:id
   */
  static async delete(req, res) {
    try {
      const result = await GalleryService.delete(
        req.user.vendorId,
        req.params.id
      );
      res.json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  /**
   * Bulk delete gallery images
   * DELETE /api/gallery/bulk
   */
  static async bulkDelete(req, res) {
    try {
      const { image_ids } = req.body;

      if (!Array.isArray(image_ids) || image_ids.length === 0) {
        return res.status(400).json({ error: "Image IDs array is required" });
      }

      const result = await GalleryService.bulkDelete(
        req.user.vendorId,
        image_ids
      );
      res.json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  /**
   * Upload gallery images (multipart/form-data)
   * POST /api/gallery/upload
   */
  static async handleUpload(req, res) {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: "No images provided" });
      }

      const category_id = req.body.category_id;
      const subcategory_id = req.body.subcategory_id;

      if (!category_id) {
        return res.status(400).json({ error: "Category is required" });
      }

      // Convert files to base64 data URLs
      const imageEntries = [];
      for (const file of req.files) {
        const base64 = file.buffer.toString("base64");
        const dataUrl = `data:${file.mimetype};base64,${base64}`;

        imageEntries.push({
          s3_url: dataUrl, // Using base64 data URL as s3_url for now
          title: file.originalname.replace(/\.[^/.]+$/, ""), // Remove extension
          category_id: category_id,
          subcategory_id: subcategory_id || undefined,
        });
      }

      // Use bulk create to save images
      const result = await GalleryService.bulkCreate(
        req.user.vendorId,
        imageEntries
      );

      res.json(result);
    } catch (err) {
      console.error("Gallery upload error:", err);
      res.status(400).json({ error: err.message || "Failed to upload images" });
    }
  }
}

export default GalleryController;


