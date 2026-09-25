import { Router } from "express";
import {
  createStudyYear,
  getStudyYears,
  getStudyYearById,
  updateStudyYear,
  deleteStudyYear,
} from "./study-year.controller";
import { authenticate } from "../../middleware/auth.middleware";
import { authorize } from "../../middleware/role.middleware";

const router = Router();

router.get("/", authenticate, getStudyYears);
router.get("/:id", authenticate, getStudyYearById);

router.post("/", authenticate, authorize("UNIVERSITY_ADMIN"), createStudyYear);
router.put(
  "/:id",
  authenticate,
  authorize("UNIVERSITY_ADMIN"),
  updateStudyYear,
);
router.delete(
  "/:id",
  authenticate,
  authorize("UNIVERSITY_ADMIN"),
  deleteStudyYear,
);

export default router;
