import { Router } from "express";
import { create, getAll, getById, update, remove } from "./semester.controller";
import { authenticate } from "../../middleware/auth.middleware";
import { authorize } from "../../middleware/role.middleware";

const router = Router();

router.get("/", authenticate, getAll);
router.get("/:id", authenticate, getById);

router.post("/", authenticate, authorize("UNIVERSITY_ADMIN"), create);
router.put("/:id", authenticate, authorize("UNIVERSITY_ADMIN"), update);
router.delete("/:id", authenticate, authorize("UNIVERSITY_ADMIN"), remove);

export default router;
