import { Router } from "express";

import {
  create,
  getAll,
  getById,
  getByUniversity,
  update,
  generate,
  validateCode,
  useLicense,
  getStats,
  suspend,
  revoke,
  reinstate,
  remove,
} from "./license.controller";

import { authenticate } from "../../middleware/auth.middleware";
import { authorize } from "../../middleware/role.middleware";

const router = Router();

// =========================================================
// PLATFORM ADMIN
// =========================================================

router.post("/", authenticate, authorize("PLATFORM_ADMIN"), create);

router.get("/", authenticate, authorize("PLATFORM_ADMIN"), getAll);

router.get("/stats", authenticate, authorize("PLATFORM_ADMIN"), getStats);

router.get("/:id", authenticate, authorize("PLATFORM_ADMIN"), getById);

router.put("/:id", authenticate, authorize("PLATFORM_ADMIN"), update);

router.patch(
  "/:id/suspend",
  authenticate,
  authorize("PLATFORM_ADMIN"),
  suspend,
);

router.patch("/:id/revoke", authenticate, authorize("PLATFORM_ADMIN"), revoke);

router.patch(
  "/:id/reinstate",
  authenticate,
  authorize("PLATFORM_ADMIN"),
  reinstate,
);

router.delete("/:id", authenticate, authorize("PLATFORM_ADMIN"), remove);

// =========================================================
// PUBLIC LICENSE ACTIVATION
// =========================================================

router.get("/validate/:code", validateCode);

router.post("/use", useLicense);

// =========================================================
// UNIVERSITY
// =========================================================

router.get("/university/:universityId", authenticate, getByUniversity);

export default router;
