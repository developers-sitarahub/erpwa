import LeadManagementService from "../services/leadManagement.service.js";

class LeadManagementController {
  /**
   * List all leads with optional filtering
   * GET /api/leads-management
   */
  static async list(req, res) {
    try {
      const filters = {
        category_id: req.query.category_id || req.query.categoryId,
        subcategory_id: req.query.subcategory_id || req.query.subCategoryId,
        status: req.query.status,
      };

      const result = await LeadManagementService.list(req.user, filters);
      res.json({ data: result });
    } catch (err) {
      console.error("Error in leads list:", err);
      res.status(400).json({ error: err.message });
    }
  }

  /**
   * Get lead by ID
   * GET /api/leads-management/:id
   */
  static async getById(req, res) {
    try {
      const lead = await LeadManagementService.getById(
        req.user,
        req.params.id
      );

      if (!lead) {
        return res.status(404).json({ error: "Lead not found" });
      }

      res.json({ data: lead });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  /**
   * Create a single lead
   * POST /api/leads-management
   */
  static async create(req, res) {
    try {
      const result = await LeadManagementService.create(
        req.user,
        req.body
      );
      res.json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  /**
   * Bulk create leads
   * POST /api/leads-management/bulk
   */
  static async bulkCreate(req, res) {
    try {
      const { leads } = req.body;

      if (!Array.isArray(leads) || leads.length === 0) {
        return res.status(400).json({ error: "Leads array is required" });
      }

      const result = await LeadManagementService.bulkCreate(
        req.user,
        leads
      );
      res.json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  /**
   * Update a lead
   * PUT /api/leads-management/:id
   */
  static async update(req, res) {
    try {
      const result = await LeadManagementService.update(
        req.user,
        req.params.id,
        req.body
      );
      res.json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  /**
   * Bulk update leads
   * PUT /api/leads-management/bulk
   */
  static async bulkUpdate(req, res) {
    try {
      const { lead_ids, ...updateData } = req.body;

      if (!Array.isArray(lead_ids) || lead_ids.length === 0) {
        return res.status(400).json({ error: "Lead IDs array is required" });
      }

      const result = await LeadManagementService.bulkUpdate(
        req.user,
        lead_ids,
        updateData
      );
      res.json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  /**
   * Delete a lead
   * DELETE /api/leads-management/:id
   */
  static async delete(req, res) {
    try {
      const result = await LeadManagementService.delete(
        req.user,
        req.params.id
      );
      res.json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  /**
   * Bulk delete leads
   * DELETE /api/leads-management/bulk
   */
  static async bulkDelete(req, res) {
    try {
      const { lead_ids } = req.body;

      if (!Array.isArray(lead_ids) || lead_ids.length === 0) {
        return res.status(400).json({ error: "Lead IDs array is required" });
      }

      const result = await LeadManagementService.bulkDelete(
        req.user,
        lead_ids
      );
      res.json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }
}

export default LeadManagementController;


