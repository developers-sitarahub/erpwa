import express from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import {
  createWorkflow,
  deleteWorkflow,
  getWorkflowById,
  getWorkflows,
  getChatbotLimits,
} from "../controllers/workflow.controller.js";

const router = express.Router();

router.use(authenticate);

// IMPORTANT: /limits must be registered BEFORE /:id to avoid being caught as an ID param
router.get("/limits", getChatbotLimits);
router.post("/", createWorkflow);
router.get("/", getWorkflows);
router.get("/:id", getWorkflowById);
router.delete("/:id", deleteWorkflow);

export default router;
