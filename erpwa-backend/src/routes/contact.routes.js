import express from "express";
import { submitInquiry } from "../controllers/contact.controller.js";

const router = express.Router();

router.post("/", submitInquiry);

export default router;
