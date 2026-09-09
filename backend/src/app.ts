import express from "express";
import cors from "cors";
import { env } from "./config/env";
import { errorHandler } from "./middleware/error.middleware";

import authRoutes from "./modules/auth/auth.routes";
import studentRoutes from "./modules/students/student.routes";
import lecturerRoutes from "./modules/lecturer/lecturer.routes";
import hodRoutes from "./modules/hod/hod.routes";
import attendanceRoutes from "./modules/attendance/attendance.routes";
import reportRoutes from "./modules/reports/report.routes";
import analyticsRoutes from "./modules/analytics/analytics.routes";
import studyYearRoutes from "./modules/study-years/study-year.routes";
import academicYearRoutes from "./modules/academic-years/academic-year.routes";
import facultyRoutes from "./modules/faculties/faculty.routes";
import departmentRoutes from "./modules/departments/department.routes";
import programmeRoutes from "./modules/programmes/programme.routes";
import semesterRoutes from "./modules/semesters/semester.routes";
import unitRoutes from "./modules/units/unit.routes";
import platformAdminRoutes from "./modules/platform-admin/platform-admin.routes";
import licenseRoutes from "./modules/licensing/license.routes";
import notificationRoutes from "./modules/notifications/notification.routes";
import universityRoutes from "./modules/universities/university.routes";
import universityAdminRoutes from "./modules/university-admin/university-admin.routes";

// ✅ Import authentication middleware
import { authenticate } from "./middleware/auth.middleware";
import { authorize } from "./middleware/role.middleware";
import { checkLicenseAccess } from "./middleware/license.middleware";
import {
  getLicenseStatus,
  requestNewLicense,
} from "./modules/university-admin/university-admin.controller";

const app = express();

app.use(cors({ origin: env.CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============================================================
// PUBLIC ROUTES (No auth, no license check)
// ============================================================
app.use("/api/auth", authRoutes);
app.use("/api/licenses", licenseRoutes); // Public for validation

// ============================================================
// ✅ LICENSE ROUTES - MUST BE BEFORE checkLicenseAccess
// ============================================================

// License status - bypasses license check
app.get(
  "/api/university-admin/license/status",
  authenticate,
  authorize("UNIVERSITY_ADMIN"),
  getLicenseStatus,
);

// Request new license - bypasses license check (so expired licenses can request)
app.post(
  "/api/university-admin/license/request-new",
  authenticate,
  authorize("UNIVERSITY_ADMIN"),
  requestNewLicense,
);

// ============================================================
// PROTECTED ROUTES (Auth → License → Routes)
// ============================================================

// University Admin
app.use(
  "/api/university-admin",
  authenticate,
  authorize("UNIVERSITY_ADMIN"),
  checkLicenseAccess,
  universityAdminRoutes,
);

// HOD
app.use(
  "/api/hod",
  authenticate,
  authorize("HOD"),
  checkLicenseAccess,
  hodRoutes,
);

// Lecturer
app.use(
  "/api/lecturer",
  authenticate,
  authorize("LECTURER"),
  checkLicenseAccess,
  lecturerRoutes,
);

// Student (for attendance check-in)
app.use(
  "/api/student",
  authenticate,
  authorize("STUDENT"),
  checkLicenseAccess,
  studentRoutes,
);

// ============================================================
// OTHER PROTECTED ROUTES
// ============================================================
app.use(
  "/api/platform-admin",
  authenticate,
  authorize("PLATFORM_ADMIN"),
  platformAdminRoutes,
);
app.use("/api/notifications", authenticate, notificationRoutes);
app.use("/api/students", authenticate, studentRoutes);
app.use("/api/lecturers", authenticate, lecturerRoutes);
app.use("/api/hods", authenticate, hodRoutes);
app.use("/api/attendance", authenticate, attendanceRoutes);
app.use("/api/reports", authenticate, reportRoutes);
app.use("/api/analytics", authenticate, analyticsRoutes);
app.use("/api/study-years", authenticate, studyYearRoutes);
app.use("/api/academic-years", authenticate, academicYearRoutes);
app.use("/api/faculties", authenticate, facultyRoutes);
app.use("/api/departments", authenticate, departmentRoutes);
app.use("/api/programmes", authenticate, programmeRoutes);
app.use("/api/semesters", authenticate, semesterRoutes);
app.use("/api/units", authenticate, unitRoutes);
app.use("/api/universities", authenticate, universityRoutes);

app.get("/api/health", (req, res) =>
  res.json({ status: "ok", timestamp: new Date().toISOString() }),
);

app.use(errorHandler);

export default app;
