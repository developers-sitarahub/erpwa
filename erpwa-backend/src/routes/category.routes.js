import express from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import CategoryController from "../controllers/category.controller.js";

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Contact routes (must come before /:id routes to avoid route conflicts)
router.get("/contacts", CategoryController.getContacts);
router.post("/contacts", CategoryController.createContact);
router.put("/contacts/:id", CategoryController.updateContact);
router.delete("/contacts/:id", CategoryController.deleteContact);
router.get("/:id/contacts", CategoryController.getContacts);

// Category routes
router.post("/", CategoryController.create);
router.get("/", CategoryController.list);
router.get("/:id", CategoryController.getById);
router.put("/:id", CategoryController.update);
router.delete("/:id", CategoryController.delete);

// Debug route (for testing - shows all categories including subcategories)
router.get("/debug/all", CategoryController.getAllCategories);

export default router;

