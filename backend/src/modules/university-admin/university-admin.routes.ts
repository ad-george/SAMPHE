import { Router } from "express";
import { upload } from "../../config/multer";
import {
  getMe,
  updateMe,
  getMyUniversity,
  updateProfile,
  getFaculties,
  createFaculty,
  updateFaculty,
  deleteFaculty,
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  getHods,
  createHod,
  updateHod,
  getAcademicYears,
  createAcademicYear,
  setActiveYear, // Added missing import
  archiveYear, // Added missing import
  unarchiveYear, // Added missing import
  deleteYear, // Added missing import
  getSessionStats,
  getHistoricalView,
  getIssues,
  createIssue,
  resolveIssue,
  getCompliance,
  globalSearch,
  getStats,
  convertTrialToSubscription,
  convertTrialToPerpetual,
  getLicenseStatus,
  getFacultyStats,
  getAvailableLecturers,
  getDepartmentStats,
  getDepartmentById,
  getHodStats,
  getHodById,
  deleteHod,
  getArchivedYears,
  getArchivedYearAttendance,
  getAcademicYearProgress,
  updateAcademicYear,
  getAttendanceStats,
  getAttendanceStatsSummary,
  exportAttendanceReport,
  getIssueStats,
  getReportSettings,
  updateReportSettings,
  getUniversitySettings,
  uploadLogo,
  syncData,
  getIntegrationSettings,
  updateIntegrationSettings,
  testIntegration,
  renewLicense,
  getLicense,
  upgradeToPerpetual,
  requestNewLicense,
  activateLicense,
  getSemesters,
  createSemester,
  updateSemester,
  deleteSemester,
} from "./university-admin.controller";
import { authenticate } from "../../middleware/auth.middleware";
import { authorize } from "../../middleware/role.middleware";
import { getBillingHistory } from "../platform-admin/platform-admin.controller";

const router = Router();
const adminGuard = [authenticate, authorize("UNIVERSITY_ADMIN")];

// Profile & Core Admin Info
router.get("/me", adminGuard, getMe);
router.put("/me", adminGuard, updateMe);
router.get("/my-university", adminGuard, getMyUniversity);
router.put("/profile", adminGuard, updateProfile);

// Core Dashboard & Analytical Trackers
router.get("/stats", adminGuard, getStats);
router.get("/compliance", adminGuard, getCompliance);
router.get("/search", adminGuard, globalSearch);
router.get("/session-stats", adminGuard, getSessionStats);
router.get("/historical/:year", adminGuard, getHistoricalView);

// Faculty Pipelines
router.get("/faculties", adminGuard, getFaculties);
router.post("/faculties", adminGuard, createFaculty);
router.get("/faculties/stats", adminGuard, getFacultyStats);
router.put("/faculties/:id", adminGuard, updateFaculty);
router.delete("/faculties/:id", adminGuard, deleteFaculty);

// Semesters
router.get("/semesters", adminGuard, getSemesters);
router.post("/semesters", adminGuard, createSemester);
router.put("/semesters/:id", adminGuard, updateSemester);
router.delete("/semesters/:id", adminGuard, deleteSemester);

// Integration routes
router.get(
  "/integration/settings",
  authenticate,
  authorize("UNIVERSITY_ADMIN"),
  getIntegrationSettings,
);
router.put(
  "/integration/settings",
  authenticate,
  authorize("UNIVERSITY_ADMIN"),
  updateIntegrationSettings,
);
router.post(
  "/integration/test",
  authenticate,
  authorize("UNIVERSITY_ADMIN"),
  testIntegration,
);
router.post(
  "/integration/sync",
  authenticate,
  authorize("UNIVERSITY_ADMIN"),
  syncData,
);

// Department Frameworks
router.get("/departments", adminGuard, getDepartments);
router.post("/departments", adminGuard, createDepartment);
router.get("/departments/stats", adminGuard, getDepartmentStats);
router.get("/departments/:id", adminGuard, getDepartmentById);
router.put("/departments/:id", adminGuard, updateDepartment);
router.delete("/departments/:id", adminGuard, deleteDepartment);

// Department Reports
router.get(
  "/attendance-stats",
  authenticate,
  authorize("UNIVERSITY_ADMIN"),
  getAttendanceStats,
);
router.get(
  "/attendance-stats/summary",
  authenticate,
  authorize("UNIVERSITY_ADMIN"),
  getAttendanceStatsSummary,
);
router.get(
  "/attendance-stats/export",
  authenticate,
  authorize("UNIVERSITY_ADMIN"),
  exportAttendanceReport,
);

// Lecturer Availability Helper
router.get("/lecturers/available", adminGuard, getAvailableLecturers);

// Head of Department (HOD) Cluster
router.get("/hods", adminGuard, getHods);
router.post("/hods", adminGuard, createHod);
router.get("/hods/stats", adminGuard, getHodStats);
router.get("/hods/:id", adminGuard, getHodById);
router.put("/hods/:id", adminGuard, updateHod);
router.delete("/hods/:id", adminGuard, deleteHod);

// ==========================================
// ACADEMIC CALENDAR LIFECYCLE (FIXED & ALIGNED)
// ==========================================
router.get("/academic-years", adminGuard, getAcademicYears);
router.post("/academic-years", adminGuard, createAcademicYear); // Fixed missing creation route
router.get("/academic-years/progress", adminGuard, getAcademicYearProgress);
router.get("/academic-years/archived", adminGuard, getArchivedYears);

// Action States matching frontend layout strings (`/academic-years/:id/...`)
router.patch("/academic-years/:id/activate", adminGuard, setActiveYear);
router.patch("/academic-years/:id/archive", adminGuard, archiveYear);
router.patch("/academic-years/:id/unarchive", adminGuard, unarchiveYear);
router.delete("/academic-years/:id", adminGuard, deleteYear);

// Specialized Historical Backups
router.get(
  "/academic-years/:id/attendance",
  adminGuard,
  getArchivedYearAttendance,
);
router.post("/academic-years/update", adminGuard, updateAcademicYear);

// System Support Issues
router.get("/issues", adminGuard, getIssues);
router.post("/issues", adminGuard, createIssue);
router.patch("/issues/:id/resolve", adminGuard, resolveIssue);
router.get(
  "/issues/stats",
  authenticate,
  authorize("UNIVERSITY_ADMIN"),
  getIssueStats,
);

// Settings routes
router.get(
  "/settings/report",
  authenticate,
  authorize("UNIVERSITY_ADMIN"),
  getReportSettings,
);
router.put(
  "/settings/report",
  authenticate,
  authorize("UNIVERSITY_ADMIN"),
  updateReportSettings,
);
router.get(
  "/settings/university",
  authenticate,
  authorize("UNIVERSITY_ADMIN"),
  getUniversitySettings,
);
router.post(
  "/logo",
  authenticate,
  authorize("UNIVERSITY_ADMIN"),
  upload.single("logo"),
  uploadLogo,
);

// Multi-Tenant B2B License Architecture (Consolidated duplicates)
router.get("/license/status", adminGuard, getLicenseStatus);
router.post(
  "/license/convert-to-subscription",
  adminGuard,
  convertTrialToSubscription,
);
router.post(
  "/license/convert-to-perpetual",
  adminGuard,
  convertTrialToPerpetual,
);
router.post("/license/request-new", adminGuard, requestNewLicense);
router.post("/license/activate", adminGuard, activateLicense);

// Multi-Tenant B2B License Architecture
router.get("/license/status", adminGuard, getLicenseStatus);
router.get("/license", adminGuard, getLicense);
router.post("/license/renew", adminGuard, renewLicense);
router.post("/license/upgrade", adminGuard, upgradeToPerpetual);
router.get("/billing", adminGuard, getBillingHistory);
router.post(
  "/license/convert-to-subscription",
  adminGuard,
  convertTrialToSubscription,
);
router.post(
  "/license/convert-to-perpetual",
  adminGuard,
  convertTrialToPerpetual,
);

export default router;
