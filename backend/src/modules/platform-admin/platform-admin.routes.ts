import { Router } from "express";
import {
  getUniversities,
  createUniversity,
  updateUniversity,
  toggleStatus,
  getStats,
  getRecentActivity,
  deleteUniversity,
  getMyLicense,
  getBillingHistory,
  renewLicense,
  upgradeToPerpetual,
  getIntegrations,
  upsertIntegration,
  toggleIntegration,
  deleteIntegration,
} from "./platform-admin.controller";
import { authenticate } from "../../middleware/auth.middleware";
import { authorize } from "../../middleware/role.middleware";
const router = Router();

router.get(
  "/universities",
  authenticate,
  authorize("PLATFORM_ADMIN"),
  getUniversities,
);
router.post(
  "/universities",
  authenticate,
  authorize("PLATFORM_ADMIN"),
  createUniversity,
);
router.put(
  "/universities/:id",
  authenticate,
  authorize("PLATFORM_ADMIN"),
  updateUniversity,
);
router.patch(
  "/universities/:id/status",
  authenticate,
  authorize("PLATFORM_ADMIN"),
  toggleStatus,
);
router.delete(
  "/universities/:id",
  authenticate,
  authorize("PLATFORM_ADMIN"),
  deleteUniversity,
);
router.get("/stats", authenticate, authorize("PLATFORM_ADMIN"), getStats);
router.get(
  "/recent-activity",
  authenticate,
  authorize("PLATFORM_ADMIN"),
  getRecentActivity,
);
// License routes
router.get(
  "/license",
  authenticate,
  authorize("UNIVERSITY_ADMIN"),
  getMyLicense,
);
router.get(
  "/billing",
  authenticate,
  authorize("UNIVERSITY_ADMIN"),
  getBillingHistory,
);
router.post(
  "/license/renew",
  authenticate,
  authorize("UNIVERSITY_ADMIN"),
  renewLicense,
);
router.post(
  "/license/upgrade",
  authenticate,
  authorize("UNIVERSITY_ADMIN"),
  upgradeToPerpetual,
);

// Integration routes
router.get(
  "/integrations",
  authenticate,
  authorize("UNIVERSITY_ADMIN"),
  getIntegrations,
);
router.post(
  "/integrations",
  authenticate,
  authorize("UNIVERSITY_ADMIN"),
  upsertIntegration,
);
router.patch(
  "/integrations/:type/toggle",
  authenticate,
  authorize("UNIVERSITY_ADMIN"),
  toggleIntegration,
);
router.delete(
  "/integrations/:type",
  authenticate,
  authorize("UNIVERSITY_ADMIN"),
  deleteIntegration,
);
export default router;
