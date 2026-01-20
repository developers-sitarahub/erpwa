import express from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import LeadController from "../controllers/lead.controller.js";

const router = express.Router();

router.use(authenticate);

router.post("/", LeadController.create);
router.get("/", LeadController.list);
router.get("/:id", LeadController.retrieve);
router.patch("/:id", LeadController.update);
router.delete("/:id", LeadController.delete);
router.post("/bulk", LeadController.bulkCreate);
router.post("/revalidate", LeadController.revalidate);

export default router;
