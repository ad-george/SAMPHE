import { Router } from "express";
import {
  loginPlatformAdmin,
  loginHod,
  loginLecturer,
  loginUniversityAdmin,
  universityAdminSignup,
} from "./auth.controller";
import { authenticate } from "../../middleware/auth.middleware";
import { authorize } from "../../middleware/role.middleware";
import { getLicenseStatus } from "../university-admin/university-admin.controller";

const router = Router();

router.post("/admin/login", loginPlatformAdmin);
router.post("/hod/login", loginHod);
router.post("/lecturer/login", loginLecturer);
router.post("/university-admin/login", loginUniversityAdmin);
router.post("/university-admin/signup", universityAdminSignup);

// ✅ License status - authenticated but bypasses license middleware
router.get(
  "/license/status",
  authenticate,
  authorize("UNIVERSITY_ADMIN", "HOD", "LECTURER"),
  getLicenseStatus,
);

export default router;
