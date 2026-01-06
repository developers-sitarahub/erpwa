import LeadService from "../services/lead.service.js";

class LeadController {
  static async create(req, res) {
    try {
      const lead = await LeadService.create(
        req.user.vendorId,
        req.body
      );
      res.json(lead);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  }

  static async list(req, res) {
    const leads = await LeadService.list(
      req.user.vendorId,
      req.query
    );
    res.json(leads);
  }

  static async retrieve(req, res) {
    const lead = await LeadService.getById(
      req.user.vendorId,
      req.params.id
    );

    if (!lead) {
      return res.status(404).json({ message: "Lead not found" });
    }

    res.json(lead);
  }

  static async update(req, res) {
    const lead = await LeadService.update(
      req.user.vendorId,
      req.params.id,
      req.body
    );
    res.json(lead);
  }

  static async delete(req, res) {
    await LeadService.delete(
      req.user.vendorId,
      req.params.id
    );
    res.json({ success: true });
  }

  static async revalidate(req, res) {
    res.json({ revalidated: true });
  }


  static async bulkCreate(req, res) {
  try {
    const { leads } = req.body;

    if (!Array.isArray(leads) || !leads.length) {
      return res.status(400).json({ message: "No leads provided" });
    }

    const results = [];

    for (const lead of leads) {
      if (!lead.phoneNumber) continue;

      const created = await LeadService.create(
        req.user.vendorId,
        lead
      );
      results.push(created);
    }

    res.json({
      success: true,
      inserted: results.length,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Bulk import failed" });
  }
}






}

export default LeadController;
