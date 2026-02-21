import express from "express";
import {
  getAllUsers,
  getSingleUser,
  updateUserRole,
  deactivateUser,
  activateUser
} from "../controllers/userController.js";

import { protect } from "../middlewares/authMiddleware.js";
import { adminOnly } from "../middlewares/adminMiddleware.js";

const router = express.Router();

router.use(protect, adminOnly);

router.get("/", getAllUsers);
router.get("/:id", getSingleUser);
router.put("/:id/role", updateUserRole);
router.put("/:id/deactivate", deactivateUser);
router.put("/:id/activate", activateUser);

export default router;