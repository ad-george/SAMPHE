import { Request, Response, NextFunction } from "express";
import { UniversityAdminService } from "./university-admin.service";
import { PrismaClient } from "@prisma/client";
import emailService from "../../services/email.service";

const prisma = new PrismaClient();
const service = new UniversityAdminService();

// Me
export const getMe = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = await service.getMe(req.user!.id);
    res.json({ success: true, data });
  } catch (e: any) {
    next({ statusCode: 400, message: e.message });
  }
};
export const updateMe = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = await service.updateMe(req.user!.id, req.body);
    res.json({ success: true, data });
  } catch (e: any) {
    next({ statusCode: 400, message: e.message });
  }
};

// University
export const getMyUniversity = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = await service.getMyUniversity(req.user!.id);
    res.json({ success: true, data });
  } catch (e: any) {
    next({ statusCode: 400, message: e.message });
  }
};
export const updateProfile = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = await service.updateUniversityProfile(
      req.user!.universityId!,
      req.body,
    );
    res.json({ success: true, data });
  } catch (e: any) {
    next({ statusCode: 400, message: e.message });
  }
};

// Faculties
export const getFaculties = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { search } = req.query;
    const data = await service.getFaculties(
      req.user!.universityId!,
      search as string,
    );
    res.json({ success: true, data });
  } catch (e: any) {
    next({ statusCode: 400, message: e.message });
  }
};
export const createFaculty = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = await service.createFaculty({
      ...req.body,
      universityId: req.user!.universityId,
    });
    res.status(201).json({ success: true, data });
  } catch (e: any) {
    next({ statusCode: 400, message: e.message });
  }
};

export const getFacultyStats = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = await service.getFacultyStats(req.user!.universityId!);
    res.json({ success: true, data });
  } catch (e: any) {
    next({ statusCode: 400, message: e.message });
  }
};

export const getAvailableLecturers = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = await service.getAvailableLecturers(req.user!.universityId!);
    res.json({ success: true, data });
  } catch (e: any) {
    next({ statusCode: 400, message: e.message });
  }
};

export const getDepartmentStats = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = await service.getDepartmentStats(req.user!.universityId!);
    res.json({ success: true, data });
  } catch (e: any) {
    next({ statusCode: 400, message: e.message });
  }
};
export const updateFaculty = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = await service.updateFaculty(req.params.id, req.body);
    res.json({ success: true, data });
  } catch (e: any) {
    next({ statusCode: 400, message: e.message });
  }
};
export const deleteFaculty = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    await service.deleteFaculty(req.params.id);
    res.json({ success: true, message: "Deleted" });
  } catch (e: any) {
    next({ statusCode: 400, message: e.message });
  }
};

// Departments
export const getDepartments = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { search } = req.query;
    const data = await service.getDepartments(
      req.user!.universityId!,
      search as string,
    );
    res.json({ success: true, data });
  } catch (e: any) {
    next({ statusCode: 400, message: e.message });
  }
};

export const getDepartmentById = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = await prisma.department.findUnique({
      where: { id: req.params.id },
      include: {
        faculty: {
          select: {
            id: true,
            name: true,
          },
        },
        hods: {
          where: { status: "ACTIVE" },
          select: {
            id: true,
            fullName: true,
            staffNumber: true,
            email: true,
            phone: true,
          },
        },
        programmes: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        _count: {
          select: {
            programmes: true,
            lecturers: true,
            Student: true,
            units: true,
          },
        },
      },
    });
    if (!data)
      return next({ statusCode: 404, message: "Department not found" });
    res.json({ success: true, data });
  } catch (e: any) {
    next({ statusCode: 400, message: e.message });
  }
};
export const createDepartment = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = await service.createDepartment({
      ...req.body,
      universityId: req.user!.universityId,
    });
    res.status(201).json({ success: true, data });
  } catch (e: any) {
    next({ statusCode: 400, message: e.message });
  }
};
export const updateDepartment = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = await service.updateDepartment(req.params.id, req.body);
    res.json({ success: true, data });
  } catch (e: any) {
    next({ statusCode: 400, message: e.message });
  }
};
export const deleteDepartment = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    await service.deleteDepartment(req.params.id);
    res.json({ success: true, message: "Deleted" });
  } catch (e: any) {
    next({ statusCode: 400, message: e.message });
  }
};

// HODs
export const getHods = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = await service.getHods(req.user!.universityId!);
    res.json({ success: true, data });
  } catch (e: any) {
    next({ statusCode: 400, message: e.message });
  }
};
export const getHodById = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = await service.getHodById(
      req.user!.universityId!,
      req.params.id,
    );
    if (!data) return next({ statusCode: 404, message: "HOD not found" });
    res.json({ success: true, data });
  } catch (e: any) {
    next({ statusCode: 400, message: e.message });
  }
};
export const getHodStats = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = await service.getHodStats(req.user!.universityId!);
    res.json({ success: true, data });
  } catch (e: any) {
    next({ statusCode: 400, message: e.message });
  }
};
export const createHod = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    // 1. Safeguard multi-tenant university context
    const universityId = req.user?.universityId;
    if (!universityId) {
      return next({
        statusCode: 401,
        message: "Unauthorized: University context missing.",
      });
    }

    // 2. Validate that the departmentId is provided in the body
    if (!req.body.departmentId) {
      return next({
        statusCode: 400,
        message: "Department is required.",
      });
    }

    // 3. Execute service with validated, type-safe arguments
    const data = await service.createHod({
      staffNumber: req.body.staffNumber,
      fullName: req.body.fullName,
      email: req.body.email,
      phone: req.body.phone,
      password: req.body.password,
      departmentId: req.body.departmentId, // Passed as a guaranteed string
      universityId: universityId, // Passed as a guaranteed string
    });

    res.status(201).json({ success: true, data });
  } catch (e: any) {
    next({ statusCode: 400, message: e.message });
  }
};
export const updateHod = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = await service.updateHod(req.params.id, {
      staffNumber: req.body.staffNumber,
      fullName: req.body.fullName,
      email: req.body.email,
      phone: req.body.phone,
      password: req.body.password,
      departmentId: req.body.departmentId || null,
      status: req.body.status,
    });
    res.json({ success: true, data });
  } catch (e: any) {
    next({ statusCode: 400, message: e.message });
  }
};
export const deleteHod = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    await service.deleteHod(req.params.id);
    res.json({ success: true, message: "HOD deleted" });
  } catch (e: any) {
    next({ statusCode: 400, message: e.message });
  }
};

// Academic Calendar
// Academic Calendar
export const getAcademicYears = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = await service.getAcademicYears(req.user?.universityId);
    res.json({ success: true, data });
  } catch (e: any) {
    next({ statusCode: 400, message: e.message });
  }
};

export const getArchivedYears = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = await service.getArchivedYears(req.user?.universityId);
    res.json({ success: true, data });
  } catch (e: any) {
    next({ statusCode: 400, message: e.message });
  }
};

export const getArchivedYearAttendance = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = await service.getArchivedYearAttendanceData(req.params.id);
    res.json({ success: true, data });
  } catch (e: any) {
    next({ statusCode: 400, message: e.message });
  }
};

export const updateAcademicYear = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const universityId = req.user?.universityId;
    if (!universityId) {
      return next({
        statusCode: 401,
        message: "University context missing.",
      });
    }
    const { startDate, endDate, name, action } = req.body;
    const data = await service.updateAcademicYear({
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      name,
      action,
      universityId,
    });
    res.json({ success: true, data });
  } catch (e: any) {
    next({ statusCode: 400, message: e.message });
  }
};

export const deleteArchivedYear = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = await service.deleteArchivedYear(req.params.id);
    res.json({ success: true, data });
  } catch (e: any) {
    next({ statusCode: 400, message: e.message });
  }
};

export const getAcademicYearProgress = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = await service.getAcademicYearProgress();
    res.json({ success: true, data });
  } catch (e: any) {
    next({ statusCode: 400, message: e.message });
  }
};
export const createAcademicYear = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const universityId = req.user?.universityId;
    if (!universityId) {
      return next({
        statusCode: 401,
        message: "University context missing.",
      });
    }
    const body = req.body;
    if (body.startDate) body.startDate = new Date(body.startDate);
    if (body.endDate) body.endDate = new Date(body.endDate);
    const data = await service.createAcademicYear({
      ...body,
      universityId,
    });
    res.status(201).json({ success: true, data });
  } catch (e: any) {
    next({ statusCode: 400, message: e.message });
  }
};

// Department Reports
export const getAttendanceStats = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { period, semesterId, academicYear } = req.query;
    const data = await service.getAttendanceStats(req.user!.universityId!, {
      period: period as string,
      semesterId: semesterId as string,
      academicYear: academicYear as string,
    });
    res.json({ success: true, data });
  } catch (e: any) {
    next({ statusCode: 400, message: e.message });
  }
};

export const getAttendanceStatsSummary = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = await service.getAttendanceStatsSummary(
      req.user!.universityId!,
    );
    res.json({ success: true, data });
  } catch (e: any) {
    next({ statusCode: 400, message: e.message });
  }
};

export const exportAttendanceReport = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { format = "pdf", semesterId, academicYear } = req.query;
    const data = await service.exportAttendanceReport(
      req.user!.universityId!,
      format as "pdf" | "excel",
      {
        semesterId: semesterId as string,
        academicYear: academicYear as string,
      },
    );

    if (format === "excel") {
      // Return JSON for Excel export (frontend will convert to CSV/XLSX)
      return res.json({ success: true, data });
    }

    // For PDF, return formatted data
    res.json({ success: true, data });
  } catch (e: any) {
    next({ statusCode: 400, message: e.message });
  }
};

export const setActiveYear = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const universityId = req.user?.universityId;
    if (!universityId)
      return next({ statusCode: 401, message: "Tenant context missing." });

    const data = await service.setActiveYear(req.params.id, universityId);
    res.json({ success: true, data });
  } catch (e: any) {
    next({ statusCode: 400, message: e.message });
  }
};

export const archiveYear = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const universityId = req.user?.universityId;
    if (!universityId)
      return next({ statusCode: 401, message: "Tenant context missing." });

    const data = await service.archiveYear(req.params.id, universityId);
    res.json({ success: true, data });
  } catch (e: any) {
    next({ statusCode: 400, message: e.message });
  }
};

export const unarchiveYear = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const universityId = req.user?.universityId;
    if (!universityId)
      return next({ statusCode: 401, message: "Tenant context missing." });

    const data = await service.unarchiveYear(req.params.id, universityId);
    res.json({ success: true, data });
  } catch (e: any) {
    next({ statusCode: 400, message: e.message });
  }
};

export const deleteYear = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const universityId = req.user?.universityId;
    if (!universityId)
      return next({ statusCode: 401, message: "Tenant context missing." });

    await service.deleteYear(req.params.id, universityId);
    res.json({ success: true, message: "Deleted successfully" });
  } catch (e: any) {
    next({ statusCode: 400, message: e.message });
  }
};

// Dashboard Stats
export const getSessionStats = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = await service.getDepartmentSessionStats(
      req.user!.universityId!,
      req.query,
    );
    res.json({ success: true, data });
  } catch (e: any) {
    next({ statusCode: 400, message: e.message });
  }
};

// Historical View
export const getHistoricalView = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = await service.getHistoricalView(
      req.user!.universityId!,
      req.params.year,
    );
    res.json({ success: true, data });
  } catch (e: any) {
    next({ statusCode: 400, message: e.message });
  }
};

// Technical Issues
export const getIssues = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { status, severity, search } = req.query;
    const data = await service.getIssues(req.user!.universityId!, {
      status: status as string,
      severity: severity as string,
      search: search as string,
    });
    res.json({ success: true, data });
  } catch (e: any) {
    next({ statusCode: 400, message: e.message });
  }
};
export const getIssueStats = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = await service.getIssueStats(req.user!.universityId!);
    res.json({ success: true, data });
  } catch (e: any) {
    next({ statusCode: 400, message: e.message });
  }
};
export const createIssue = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = await service.createIssue({
      ...req.body,
      universityId: req.user!.universityId,
      reportedBy: req.user?.fullName || "System",
    });
    res.status(201).json({ success: true, data });
  } catch (e: any) {
    next({ statusCode: 400, message: e.message });
  }
};
export const resolveIssue = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = await service.resolveIssue(
      req.user!.universityId!,
      req.params.id,
    );
    res.json({ success: true, data });
  } catch (e: any) {
    next({ statusCode: 400, message: e.message });
  }
};

// ============================================================
// SETTINGS
// ============================================================

export const getReportSettings = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = await service.getReportSettings(req.user!.universityId!);
    res.json({ success: true, data });
  } catch (e: any) {
    next({ statusCode: 400, message: e.message });
  }
};

export const updateReportSettings = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { accentColor, showAllStudents } = req.body;
    const data = await service.updateReportSettings(req.user!.universityId!, {
      accentColor,
      showAllStudents,
    });
    res.json({ success: true, data });
  } catch (e: any) {
    next({ statusCode: 400, message: e.message });
  }
};

export const uploadLogo = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.file) {
      return next({ statusCode: 400, message: "No file uploaded" });
    }

    // Build the URL for the uploaded file
    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const logoUrl = `${baseUrl}/uploads/logos/${req.file.filename}`;

    const data = await service.uploadLogo(req.user!.universityId!, logoUrl);
    res.json({ success: true, data });
  } catch (e: any) {
    next({ statusCode: 400, message: e.message });
  }
};

export const universityAdminSignup = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { licenseCode, licenseType, ...data } = req.body;

    // ... existing validation ...

    // Create university with default report settings
    const university = await prisma.university.create({
      data: {
        name: data.institutionName,
        email: data.institutionEmail,
        phone: data.institutionPhone,
        address: data.institutionType,
        licenseType: licenseType,
        status: "PENDING",
        // ✅ Set default report settings on signup
        reportSettings: {
          accentColor: "#10b981",
          showAllStudents: true,
        },
      },
    });

    // ... rest of the signup logic
  } catch (error: any) {
    next({ statusCode: 400, message: error.message });
  }
};

export const getUniversitySettings = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = await service.getUniversitySettings(req.user!.universityId!);
    res.json({ success: true, data });
  } catch (e: any) {
    next({ statusCode: 400, message: e.message });
  }
};

// Compliance
export const getCompliance = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = await service.getCompliance(req.user!.universityId!);
    res.json({ success: true, data });
  } catch (e: any) {
    next({ statusCode: 400, message: e.message });
  }
};

// Search
export const globalSearch = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = await service.globalSearch(
      req.user!.universityId!,
      req.query.q as string,
    );
    res.json({ success: true, data });
  } catch (e: any) {
    next({ statusCode: 400, message: e.message });
  }
};

// Stats
export const getStats = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = await service.getStats(req.user!.universityId!);
    res.json({ success: true, data });
  } catch (e: any) {
    next({ statusCode: 400, message: e.message });
  }
};

// License Status
export const checkLicenseStatus = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = await service.checkLicenseStatus(req.user!.universityId!);
    res.json({ success: true, data });
  } catch (e: any) {
    next({ statusCode: 400, message: e.message });
  }
};

export const getIntegrationSettings = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = await service.getIntegrationSettings(req.user!.universityId!);
    res.json({ success: true, data });
  } catch (e: any) {
    next({ statusCode: 400, message: e.message });
  }
};

export const updateIntegrationSettings = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = await service.updateIntegrationSettings(
      req.user!.universityId!,
      req.body,
    );
    res.json({ success: true, data });
  } catch (e: any) {
    next({ statusCode: 400, message: e.message });
  }
};

export const testIntegration = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = await service.testIntegrationConnection(
      req.user!.universityId!,
    );
    res.json({ success: true, data });
  } catch (e: any) {
    next({ statusCode: 400, message: e.message });
  }
};

export const syncData = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = await service.syncData(req.user!.universityId!);
    res.json({ success: true, data });
  } catch (e: any) {
    next({ statusCode: 400, message: e.message });
  }
};

// Convert Trial to Subscription
export const convertTrialToSubscription = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const durationMonths = req.body.durationMonths || 12;
    const data = await service.convertTrialToSubscription(
      req.user!.universityId!,
    );
    res.json({ success: true, data });
  } catch (e: any) {
    next({ statusCode: 400, message: e.message });
  }
};

export const getLicenseStatus = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = await service.getLicenseStatus(req.user!.universityId!);
    res.json({ success: true, data });
  } catch (e: any) {
    next({ statusCode: 400, message: e.message });
  }
};

// --- Semesters ---

export const getSemesters = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = await service.getSemesters(req.user!.universityId!);
    res.json({ success: true, data });
  } catch (e: any) {
    next({ statusCode: 400, message: e.message });
  }
};

export const createSemester = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { name, startDate, endDate, studyYearId } = req.body;
    const data = await service.createSemester({
      name,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      studyYearId,
      universityId: req.user!.universityId!,
    });
    res.status(201).json({ success: true, data });
  } catch (e: any) {
    next({ statusCode: 400, message: e.message });
  }
};

export const updateSemester = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { name, startDate, endDate } = req.body;
    const data = await service.updateSemester(req.params.id, {
      name,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });
    res.json({ success: true, data });
  } catch (e: any) {
    next({ statusCode: 400, message: e.message });
  }
};

export const deleteSemester = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    await service.deleteSemester(req.params.id);
    res.json({ success: true, message: "Semester deleted" });
  } catch (e: any) {
    next({ statusCode: 400, message: e.message });
  }
};

// --- LICENSE MANAGEMENT ---

export const getLicense = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const license = await prisma.license.findFirst({
      where: {
        universityId: req.user!.universityId,
        status: { in: ["ACTIVE", "USED", "EXPIRED"] },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json({ success: true, data: license });
  } catch (e: any) {
    next({ statusCode: 400, message: e.message });
  }
};

export const renewLicense = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { durationMonths = 12 } = req.body;
    const universityId = req.user!.universityId;

    const license = await prisma.license.findFirst({
      where: {
        universityId,
        status: { in: ["ACTIVE", "USED", "EXPIRED"] },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!license) {
      return next({ statusCode: 404, message: "No active license found" });
    }

    if (license.type === "PERPETUAL") {
      return next({
        statusCode: 400,
        message: "Perpetual license does not need renewal",
      });
    }

    const now = new Date();
    const newExpiryDate = new Date(now);
    newExpiryDate.setMonth(newExpiryDate.getMonth() + durationMonths);

    const updatedLicense = await prisma.license.update({
      where: { id: license.id },
      data: {
        expiryDate: newExpiryDate,
        status: "ACTIVE",
        startDate: now,
      },
    });

    if (!license.universityId) {
      throw new Error(
        `Cannot create a renewal billing event because License (${license.id}) is not yet linked to any university.`,
      );
    }

    await prisma.billingEvent.create({
      data: {
        licenseId: license.id,
        universityId: license.universityId,
        eventType: "RENEWAL",
        amount: 299.0,
        description: `License renewed for ${durationMonths} months`,
        status: "COMPLETED",
      },
    });

    res.json({ success: true, data: updatedLicense });
  } catch (e: any) {
    next({ statusCode: 400, message: e.message });
  }
};

export const upgradeToPerpetual = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const universityId = req.user!.universityId;

    const license = await prisma.license.findFirst({
      where: {
        universityId,
        status: { in: ["ACTIVE", "USED", "EXPIRED"] },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!license) {
      return next({ statusCode: 404, message: "No active license found" });
    }

    if (license.type === "PERPETUAL") {
      return next({ statusCode: 400, message: "Already a perpetual license" });
    }

    const updatedLicense = await prisma.license.update({
      where: { id: license.id },
      data: {
        type: "PERPETUAL",
        expiryDate: null,
      },
    });

    res.json({ success: true, data: updatedLicense });
  } catch (e: any) {
    next({ statusCode: 400, message: e.message });
  }
};

export const getBillingHistory = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const universityId = req.user!.universityId;

    // Get all licenses for this university with their billing events
    const licenses = await prisma.license.findMany({
      where: {
        universityId,
      },
      include: {
        billingHistory: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Transform into a flat history list
    const history: any[] = [];

    licenses.forEach((license) => {
      // If there are billing events, use them
      if (license.billingHistory.length > 0) {
        license.billingHistory.forEach((event) => {
          history.push({
            id: event.id,
            licenseCode: license.code,
            type: license.type || "SUBSCRIPTION",
            amount: event.amount,
            paymentDate: event.createdAt,
            status: license.status,
            description: event.description,
          });
        });
      } else {
        // If no billing events (e.g., trial), create a default entry
        history.push({
          id: license.id,
          licenseCode: license.code,
          type: license.type || "SUBSCRIPTION",
          amount: 0,
          paymentDate: license.createdAt,
          status: license.status,
          description: `${license.type || "SUBSCRIPTION"} license activated`,
        });
      }
    });

    // Sort by payment date descending (newest first)
    history.sort(
      (a, b) =>
        new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime(),
    );

    res.json({ success: true, data: history });
  } catch (e: any) {
    next({ statusCode: 400, message: e.message });
  }
};

export const requestNewLicense = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const universityId = req.user!.universityId;
    const admin = await prisma.universityAdmin.findUnique({
      where: { id: req.user!.id },
      include: { university: true },
    });

    if (!admin) {
      return next({ statusCode: 404, message: "Admin not found" });
    }

    const currentLicense = await prisma.license.findFirst({
      where: { universityId },
      orderBy: { createdAt: "desc" },
    });

    // Get the Platform Admin
    const platformAdmin = await prisma.platformAdmin.findFirst({
      select: { id: true, email: true },
    });

    if (platformAdmin) {
      // In-app notification
      await prisma.notification.create({
        data: {
          userType: "PLATFORM_ADMIN",
          userId: platformAdmin.id,
          category: "LICENSE",
          title: "🔑 License Renewal Request",
          message: `${admin.university?.name || "A university"} has requested a new license.\n\nContact: ${admin.email}\nPhone: ${admin.phone || "N/A"}\nCurrent License: ${currentLicense?.code || "N/A"}\nRequested By: ${admin.fullName}`,
        },
      });

      // Email notification
      await emailService.sendLicenseRequestNotification(
        platformAdmin.email,
        admin.university?.name || "A university",
        admin.fullName,
        admin.email,
        admin.phone || "N/A",
        currentLicense?.code || "N/A",
      );
    }

    res.json({
      success: true,
      message:
        "License renewal request sent to Platform Admin. You will receive the new license code shortly.",
    });
  } catch (e: any) {
    next({ statusCode: 400, message: e.message });
  }
};

export const activateLicense = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    console.log("🔑 Activating license with code:", req.body.code);
    const { code } = req.body;
    const universityId = req.user!.universityId;
    const admin = await prisma.universityAdmin.findUnique({
      where: { id: req.user!.id },
    });

    if (!admin) {
      return next({
        statusCode: 404,
        message: "Admin not found",
      });
    }

    // Clean the license code
    const cleanCode = code
      .toUpperCase()
      .trim()
      .replace(/^SUAMP-/, "")
      .replace(/-/g, "");

    if (cleanCode.length < 16) {
      return res.status(400).json({
        success: false,
        message: "INCOMPLETE",
        error: "License code is incomplete. Please enter all 16 characters.",
      });
    }

    if (cleanCode.length > 16) {
      return res.status(400).json({
        success: false,
        message: "INVALID",
        error: "Invalid license code.",
      });
    }

    // Find the license
    const license = await prisma.license.findUnique({
      where: { code: cleanCode },
    });

    if (!license) {
      return res.status(400).json({
        success: false,
        message: "INVALID",
        error: "Invalid license code.",
      });
    }

    // Check if already used
    if (license.status === "USED" || license.status === "ACTIVE") {
      return res.status(400).json({
        success: false,
        message: "USED",
        error: "License code has already been used.",
      });
    }

    // Check if expired
    if (license.expiryDate && new Date(license.expiryDate) < new Date()) {
      return res.status(400).json({
        success: false,
        message: "EXPIRED",
        error: "License code has expired.",
      });
    }

    // Check if revoked
    if (license.status === "REVOKED") {
      return res.status(400).json({
        success: false,
        message: "REVOKED",
        error: "This license has been revoked.",
      });
    }

    // Check if suspended
    if (license.status === "SUSPENDED") {
      return res.status(400).json({
        success: false,
        message: "SUSPENDED",
        error: "This license has been suspended.",
      });
    }

    // Activate the license
    const updatedLicense = await prisma.$transaction(async (tx) => {
      const activated = await tx.license.update({
        where: { id: license.id },
        data: {
          status: "USED",
          universityId,
          usedBy: admin.email,
          startDate: new Date(),
        },
      });

      // Update university status
      await tx.university.update({
        where: { id: universityId },
        data: {
          status: "ACTIVE",
          licenseType: license.type,
        },
      });

      // Activate university admin
      await tx.universityAdmin.update({
        where: { id: admin.id },
        data: { status: "ACTIVE" },
      });

      // 1. Validate that we actually have a university ID
      if (!universityId) {
        throw new Error(
          "Cannot activate license: A valid universityId must be provided.",
        );
      }

      // 2. Create billing event
      await tx.billingEvent.create({
        data: {
          licenseId: license.id,
          universityId,
          eventType: "ACTIVATION",
          amount:
            license.type === "PERPETUAL" ? 2499 : license.isTrial ? 0 : 299,
          currency: "KES",
          description: `${license.type} license activated${license.isTrial ? " (Trial)" : ""}`,
          status: "COMPLETED",
        },
      });

      return activated;
    });

    res.json({
      success: true,
      data: updatedLicense,
      message: "License activated successfully!",
    });
  } catch (e: any) {
    next({ statusCode: 400, message: e.message });
  }
};

// Convert Trial to Perpetual
export const convertTrialToPerpetual = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = await service.convertTrialToPerpetual(req.user!.universityId!);
    res.json({ success: true, data });
  } catch (e: any) {
    next({ statusCode: 400, message: e.message });
  }
};
