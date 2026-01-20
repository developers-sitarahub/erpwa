import CampaignService from "../services/campaign.service.js";

class CampaignController {
  static async createTemplateCampaign(req, res) {
    try {
      const result = await CampaignService.createTemplateCampaign(
        req.user,
        req.body
      );
      res.json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  static async createImageCampaign(req, res) {
    try {
      const result = await CampaignService.createImageCampaign(
        req.user,
        req.body
      );
      res.json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  static async listCampaigns(req, res) {
    try {
      const result = await CampaignService.listCampaigns(req.user);
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
}

export default CampaignController;
