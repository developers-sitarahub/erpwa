import express from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import LeadManagementController from "../controllers/leadManagement.controller.js";

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Lead management routes
router.get("/", LeadManagementController.list);
router.get("/:id", LeadManagementController.getById);
router.post("/", LeadManagementController.create);
router.post("/bulk", LeadManagementController.bulkCreate);
router.put("/:id", LeadManagementController.update);
router.put("/bulk", LeadManagementController.bulkUpdate);
router.delete("/:id", LeadManagementController.delete);
router.delete("/bulk", LeadManagementController.bulkDelete);

export default router;



