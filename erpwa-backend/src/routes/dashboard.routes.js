import express from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import * as DashboardController from "../controllers/dashboard.controller.js";

const router = express.Router();

// Get dashboard statistics
router.get("/stats", authenticate, DashboardController.getDashboardStats);

export default router;
