import { Router } from "express";
import {
  create,
  getAll,
  getById,
  update,
  remove,
} from "./academic-year.controller";
import { authenticate } from "../../middleware/auth.middleware";
import { authorize } from "../../middleware/role.middleware";

const router = Router();

// Reads — any authenticated user
router.get("/", authenticate, getAll);
router.get("/:id", authenticate, getById);

// Writes — University Admin only
router.post("/", authenticate, authorize("UNIVERSITY_ADMIN"), create);
router.put("/:id", authenticate, authorize("UNIVERSITY_ADMIN"), update);
router.delete("/:id", authenticate, authorize("UNIVERSITY_ADMIN"), remove);

export default router;
