import express from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import {
  createWorkflow,
  deleteWorkflow,
  getWorkflowById,
  getWorkflows,
} from "../controllers/workflow.controller.js";

const router = express.Router();

router.use(authenticate);

router.post("/", createWorkflow);
router.get("/", getWorkflows);
router.get("/:id", getWorkflowById);
router.delete("/:id", deleteWorkflow);

export default router;
