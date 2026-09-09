import { Router } from "express";
import {
  getMe,
  updateMe,
  getDashboardStats,
  getFullDashboard,
  getLecturers,
  createLecturer,
  updateLecturer,
  deleteLecturer,
  getStudents,
  createStudent,
  updateStudent,
  deleteStudent,
  getPrograms,
  createProgram,
  updateProgram,
  deleteProgram,
  getUnits,
  createUnit,
  updateUnit,
  deleteUnit,
  getStudyYears,
  createStudyYear,
  updateStudyYear,
  deleteStudyYear,
  getSemesters,
  createSemester,
  updateSemester,
  deleteSemester,
  getLecturerTracking,
  getStudentTracking,
  getClassRecords,
  getAnalytics,
  searchDepartment,
  generateReport,
  importStudents,
  importUnits,
  upload,
  promoteSemester,
  promoteYear,
  archiveStudent,
  unarchiveStudent,
  getArchivedStudents,
  deleteStudentPermanent,
  promoteAllSemester,
  promoteAllYear,
  getPromotionHistory,
  getAvailableUnits,
  assignUnits,
  unassignUnit,
  getLecturerAssignedUnits,
} from "./hod.controller";
import { authenticate } from "../../middleware/auth.middleware";
import { authorize } from "../../middleware/role.middleware";

const router = Router();

router.get("/me", authenticate, authorize("HOD"), getMe);
router.put("/me", authenticate, authorize("HOD"), updateMe);
router.get("/dashboard", authenticate, authorize("HOD"), getDashboardStats);
router.get("/dashboard-full", authenticate, authorize("HOD"), getFullDashboard);

// Students
router.get("/students", authenticate, authorize("HOD"), getStudents);
router.post("/students", authenticate, authorize("HOD"), createStudent);
router.post(
  "/students/import",
  authenticate,
  authorize("HOD"),
  upload.single("file"),
  importStudents,
);
router.post(
  "/students/promote-semester",
  authenticate,
  authorize("HOD"),
  promoteSemester,
);
router.post(
  "/students/promote-year",
  authenticate,
  authorize("HOD"),
  promoteYear,
);
router.patch(
  "/students/:id/archive",
  authenticate,
  authorize("HOD"),
  archiveStudent,
);
router.patch(
  "/students/:id/unarchive",
  authenticate,
  authorize("HOD"),
  unarchiveStudent,
);
router.get(
  "/students/archived",
  authenticate,
  authorize("HOD"),
  getArchivedStudents,
);
router.delete(
  "/students/:id/permanent",
  authenticate,
  authorize("HOD"),
  deleteStudentPermanent,
);
router.put("/students/:id", authenticate, authorize("HOD"), updateStudent);
router.delete("/students/:id", authenticate, authorize("HOD"), deleteStudent);

// Promote All
router.post(
  "/students/promote-all-semester",
  authenticate,
  authorize("HOD"),
  promoteAllSemester,
);
router.post(
  "/students/promote-all-year",
  authenticate,
  authorize("HOD"),
  promoteAllYear,
);

// Promotion History
router.get(
  "/students/promotion-history",
  authenticate,
  authorize("HOD"),
  getPromotionHistory,
);

// Units
router.get("/units", authenticate, authorize("HOD"), getUnits);
router.post("/units", authenticate, authorize("HOD"), createUnit);
router.post(
  "/units/import",
  authenticate,
  authorize("HOD"),
  upload.single("file"),
  importUnits,
);
router.put("/units/:id", authenticate, authorize("HOD"), updateUnit);
router.delete("/units/:id", authenticate, authorize("HOD"), deleteUnit);

// Lecturers
router.get("/lecturers", authenticate, authorize("HOD"), getLecturers);
router.post("/lecturers", authenticate, authorize("HOD"), createLecturer);
router.put("/lecturers/:id", authenticate, authorize("HOD"), updateLecturer);
router.delete("/lecturers/:id", authenticate, authorize("HOD"), deleteLecturer);
router.get(
  "/lecturers/:id/tracking",
  authenticate,
  authorize("HOD"),
  getLecturerTracking,
);

// Lecturer Unit Assignment
router.get(
  "/lecturers/:id/available-units",
  authenticate,
  authorize("HOD"),
  getAvailableUnits,
);
router.get(
  "/lecturers/:id/assigned-units",
  authenticate,
  authorize("HOD"),
  getLecturerAssignedUnits,
);
router.post(
  "/lecturers/:id/assign-units",
  authenticate,
  authorize("HOD"),
  assignUnits,
);
router.delete(
  "/lecturers/:id/unassign-unit/:unitId",
  authenticate,
  authorize("HOD"),
  unassignUnit,
);

// Programs
router.get("/programs", authenticate, authorize("HOD"), getPrograms);
router.post("/programs", authenticate, authorize("HOD"), createProgram);
router.put("/programs/:id", authenticate, authorize("HOD"), updateProgram);
router.delete("/programs/:id", authenticate, authorize("HOD"), deleteProgram);

// Study Years
router.get("/study-years", authenticate, authorize("HOD"), getStudyYears);
router.post("/study-years", authenticate, authorize("HOD"), createStudyYear);
router.put("/study-years/:id", authenticate, authorize("HOD"), updateStudyYear);
router.delete(
  "/study-years/:id",
  authenticate,
  authorize("HOD"),
  deleteStudyYear,
);

// Semesters
router.get("/semesters", authenticate, authorize("HOD"), getSemesters);
router.post("/semesters", authenticate, authorize("HOD"), createSemester);
router.put("/semesters/:id", authenticate, authorize("HOD"), updateSemester);
router.delete("/semesters/:id", authenticate, authorize("HOD"), deleteSemester);

// Tracking & Records
router.get(
  "/students/:id/tracking",
  authenticate,
  authorize("HOD"),
  getStudentTracking,
);
router.get("/class-records", authenticate, authorize("HOD"), getClassRecords);

// Analytics & Search
router.get("/analytics", authenticate, authorize("HOD"), getAnalytics);
router.get("/search", authenticate, authorize("HOD"), searchDepartment);
router.get("/reports/generate", authenticate, authorize("HOD"), generateReport);

export default router;
