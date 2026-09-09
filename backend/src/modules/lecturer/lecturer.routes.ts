import { Router } from "express";
import {
  getMe,
  updateMe,
  getDashboardStats,
  getMyUnits,
  createSession,
  getActiveSession,
  getSession,
  getMyStudents,
  getStudentDetail,
  deleteSession,
  endSession,
  getHistory,
  getStudentTracking,
  getAnalytics,
  searchLecturerScope,
  archiveSession,
  unarchiveSession,
  getSessionByToken,
  markAttendance,
  getArchived,
  searchStudentByName,
  exportAttendanceReport,
} from "./lecturer.controller";
import { authenticate } from "../../middleware/auth.middleware";
import { authorize } from "../../middleware/role.middleware";

const router = Router();

router.get("/me", authenticate, authorize("LECTURER"), getMe);
router.put("/me", authenticate, authorize("LECTURER"), updateMe);

router.get(
  "/dashboard",
  authenticate,
  authorize("LECTURER"),
  getDashboardStats,
);
router.get("/units", authenticate, authorize("LECTURER"), getMyUnits);

router.get("/attend/:token", getSessionByToken);
router.post("/attend/:token", markAttendance);

router.post("/sessions", authenticate, authorize("LECTURER"), createSession);
router.get("/students", authenticate, authorize("LECTURER"), getMyStudents);
router.get(
  "/students/:id/detail",
  authenticate,
  authorize("LECTURER"),
  getStudentDetail,
);
router.delete(
  "/sessions/:id",
  authenticate,
  authorize("LECTURER"),
  deleteSession,
);
router.get(
  "/sessions/active",
  authenticate,
  authorize("LECTURER"),
  getActiveSession,
);
router.get("/sessions/:id", authenticate, authorize("LECTURER"), getSession);
router.patch(
  "/sessions/:id/end",
  authenticate,
  authorize("LECTURER"),
  endSession,
);

router.get("/history", authenticate, authorize("LECTURER"), getHistory);

router.get("/search", authenticate, authorize("LECTURER"), searchLecturerScope);
router.patch(
  "/sessions/:id/archive",
  authenticate,
  authorize("LECTURER"),
  archiveSession,
);
router.patch(
  "/sessions/:id/unarchive",
  authenticate,
  authorize("LECTURER"),
  unarchiveSession,
);
router.get(
  "/sessions/archived",
  authenticate,
  authorize("LECTURER"),
  getArchived,
);

router.get(
  "/students/:id/tracking",
  authenticate,
  authorize("LECTURER"),
  getStudentTracking,
);

router.get(
  "/students/search",
  authenticate,
  authorize("LECTURER"),
  searchStudentByName,
);

router.get(
  "/reports/export/:sessionId",
  authenticate,
  authorize("LECTURER"),
  exportAttendanceReport,
);

router.get("/analytics", authenticate, authorize("LECTURER"), getAnalytics);

export default router;
