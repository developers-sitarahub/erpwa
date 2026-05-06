import express from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import {
    listUsers,
    createUser,
    updateUser,
    deleteUser,
    getTeamLimits,
} from "../controllers/user.controller.js";

const router = express.Router();

router.use(authenticate);

router.get("/limits", getTeamLimits);
router.get("/", listUsers);
router.post("/", createUser);
router.put("/:id", updateUser);
router.delete("/:id", deleteUser);

export default router;
