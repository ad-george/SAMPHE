import { Request, Response, NextFunction } from "express";
import { HodService } from "./hod.service";
const service = new HodService();
import xlsx from "xlsx";
import multer from "multer";
export const upload = multer({ storage: multer.memoryStorage() });

const getHodContext = async (req: Request) => {
  const hod = await service.getMe(req.user!.id);
  if (!hod) throw new Error("HOD not found");
  return hod;
};

// Helper: robust Excel column reader
const readExcelRows = (buffer: Buffer) => {
  const workbook = xlsx.read(buffer, { type: "buffer" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];

  // Try standard header parsing
  let rows = xlsx.utils.sheet_to_json(sheet);
  console.log("Standard parse rows:", rows.length);

  // Fallback: raw array-of-arrays if standard fails
  if (rows.length === 0) {
    const raw = xlsx.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
    console.log("Raw fallback rows:", raw.length);
    if (raw.length > 1) {
      const headers = raw[0].map((h: any) => String(h || "").trim());
      rows = raw.slice(1).map((r: any[]) => {
        const obj: any = {};
        headers.forEach((h, i) => {
          if (h) obj[h] = r[i];
        });
        return obj;
      });
    }
  }

  // Fuzzy value getter
  const getVal = (row: any, keys: string[]) => {
    for (const k of keys) {
      const lowerK = k.toLowerCase().replace(/\s/g, "");
      for (const key of Object.keys(row)) {
        const clean = key
          .toLowerCase()
          .replace(/\s/g, "")
          .replace(/[^a-z0-9]/g, "");
        if (clean === lowerK || key.toLowerCase() === k.toLowerCase()) {
          return String(row[key]).trim();
        }
      }
    }
    return "";
  };

  return { rows, getVal };
};

// ==================== IMPORT STUDENTS ====================
export const importStudents = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.file) throw new Error("No file uploaded");

    const { rows, getVal } = readExcelRows(req.file.buffer);
    console.log("First raw row:", rows[0]);

    const students = (rows as any[])
      .map((row: any) => ({
        regNo: getVal(row, [
          "regNo",
          "RegNo",
          "Reg No",
          "RegistrationNumber",
          "SN",
          "S/N",
          "ID",
          "StudentID",
        ]),
        fullName: getVal(row, [
          "fullName",
          "FullName",
          "Full Name",
          "Name",
          "StudentName",
        ]),
        email: getVal(row, ["email", "Email", "E-mail", "Mail"]),
        program: getVal(row, [
          "program",
          "Program",
          "Programme",
          "Course",
          "Degree",
        ]),
        studyYear: getVal(row, [
          "studyYear",
          "StudyYear",
          "Study Year",
          "Year",
          "AcademicYear",
          "Yr",
        ]),
        semester: (() => {
          let val = getVal(row, ["semester", "Semester", "Sem", "Term"]);
          if (!val) {
            // Try to get just the number from columns like "1", "2", "3"
            const num = getVal(row, ["1", "2", "3"]);
            if (num && /^\d+$/.test(num)) {
              val = `Sem ${num}`;
            }
          } else if (/^\d+$/.test(val)) {
            // If value is just "1" or "2", convert to "Semester 1"
            val = `Sem ${val}`;
          }
          return val;
        })(),
        phone:
          getVal(row, [
            "phone",
            "Phone",
            "PhoneNumber",
            "Mobile",
            "Tel",
            "Telephone",
          ]) || "",
      }))
      .filter((s: any) => s.regNo && s.fullName && s.email);

    console.log("Mapped students:", students.length, students[0]);

    const result = await service.bulkImportStudents(req.user!.id, students);
    res.status(201).json({ success: true, data: result });
  } catch (e: any) {
    console.error("IMPORT ERROR:", e);
    next({ statusCode: 400, message: e.message });
  }
};

// ============================================================
// PROMOTE ALL
// ============================================================

export const promoteAllSemester = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = await service.promoteAllToNextSemester(
      req.user!.id,
      req.body.filters || {},
    );
    res.json({ success: true, data });
  } catch (e: any) {
    next({ statusCode: 400, message: e.message });
  }
};

export const promoteAllYear = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = await service.promoteAllToNextStudyYear(
      req.user!.id,
      req.body.filters || {},
    );
    res.json({ success: true, data });
  } catch (e: any) {
    next({ statusCode: 400, message: e.message });
  }
};

// ============================================================
// PROMOTION HISTORY
// ============================================================

export const getPromotionHistory = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = await service.getPromotionHistory(
      req.user!.id,
      req.query.studentId as string,
    );
    res.json({ success: true, data });
  } catch (e: any) {
    next({ statusCode: 400, message: e.message });
  }
};

// ==================== IMPORT UNITS ====================
export const importUnits = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.file) throw new Error("No file uploaded");

    const { rows, getVal } = readExcelRows(req.file.buffer);

    const units = (rows as any[])
      .map((row: any) => ({
        code: getVal(row, [
          "unitCode",
          "UnitCode",
          "Unit Code",
          "Code",
          "UnitID",
        ]),
        name: getVal(row, [
          "unitName",
          "UnitName",
          "Unit Name",
          "Name",
          "Unit",
        ]),
        program: getVal(row, ["program", "Program", "Programme", "Course"]),
        studyYear: getVal(row, [
          "studyYear",
          "StudyYear",
          "Study Year",
          "Year",
          "AcademicYear",
        ]),
        semester: getVal(row, ["semester", "Semester", "Sem", "Term"]),
      }))
      .filter((u: any) => u.code && u.name);

    console.log("Mapped units:", units.length, units[0]);

    const result = await service.bulkImportUnits(req.user!.id, units);
    res.status(201).json({ success: true, data: result });
  } catch (e: any) {
    console.error("IMPORT UNITS ERROR:", e);
    next({ statusCode: 400, message: e.message });
  }
};

// ==================== PROMOTE / ARCHIVE ====================
export const promoteSemester = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = await service.promoteToNextSemester(
      req.user!.id,
      req.body.studentIds,
    );
    res.json({ success: true, data });
  } catch (e: any) {
    next({ statusCode: 400, message: e.message });
  }
};

export const promoteYear = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = await service.promoteToNextStudyYear(
      req.user!.id,
      req.body.studentIds,
    );
    res.json({ success: true, data });
  } catch (e: any) {
    next({ statusCode: 400, message: e.message });
  }
};

export const archiveStudent = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = await service.archiveStudent(
      req.user!.id,
      req.params.id,
      req.body.archiveUntil,
    );
    res.json({ success: true, data });
  } catch (e: any) {
    next({ statusCode: 400, message: e.message });
  }
};

export const unarchiveStudent = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = await service.unarchiveStudent(req.user!.id, req.params.id);
    res.json({ success: true, data });
  } catch (e: any) {
    next({ statusCode: 400, message: e.message });
  }
};

export const getArchivedStudents = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = await service.getArchivedStudents(req.user!.id, req.query);
    res.json({ success: true, data });
  } catch (e: any) {
    next({ statusCode: 400, message: e.message });
  }
};

export const deleteStudentPermanent = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = await service.permanentlyDeleteStudent(
      req.user!.id,
      req.params.id,
    );
    res.json({ success: true, data });
  } catch (e: any) {
    next({ statusCode: 400, message: e.message });
  }
};

// ==================== PROFILE ====================
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

// ==================== DASHBOARD ====================
export const getDashboardStats = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = await service.getDashboardStats(req.user!.id);
    res.json({ success: true, data });
  } catch (e: any) {
    next({ statusCode: 400, message: e.message });
  }
};

export const getFullDashboard = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = await service.getFullDashboard(req.user!.id);
    res.json({ success: true, data });
  } catch (e: any) {
    next({ statusCode: 400, message: e.message });
  }
};

// ==================== LECTURERS ====================
export const getLecturers = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const hod = await getHodContext(req);
    const data = await service.getLecturers(hod.departmentId);
    res.json({ success: true, data });
  } catch (e: any) {
    next({ statusCode: 400, message: e.message });
  }
};

export const createLecturer = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const hod = await getHodContext(req);
    const data = await service.createLecturer({
      ...req.body,
      departmentId: hod.departmentId,
      universityId: hod.universityId,
    });
    res.status(201).json({ success: true, data });
  } catch (e: any) {
    next({ statusCode: 400, message: e.message });
  }
};

export const updateLecturer = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = await service.updateLecturer(req.params.id, req.body);
    res.json({ success: true, data });
  } catch (e: any) {
    next({ statusCode: 400, message: e.message });
  }
};

export const deleteLecturer = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    await service.deleteLecturer(req.params.id);
    res.json({ success: true, message: "Deleted" });
  } catch (e: any) {
    next({ statusCode: 400, message: e.message });
  }
};

// ==================== STUDENTS ====================
export const getStudents = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const hod = await getHodContext(req);
    const data = await service.getStudents(hod.departmentId, req.query);
    res.json({ success: true, data });
  } catch (e: any) {
    next({ statusCode: 400, message: e.message });
  }
};

export const createStudent = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const hod = await getHodContext(req);
    const data = await service.createStudent({
      ...req.body,
      departmentId: hod.departmentId,
      universityId: hod.universityId,
    });
    res.status(201).json({ success: true, data });
  } catch (e: any) {
    next({ statusCode: 400, message: e.message });
  }
};

export const updateStudent = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = await service.updateStudent(req.params.id, req.body);
    res.json({ success: true, data });
  } catch (e: any) {
    next({ statusCode: 400, message: e.message });
  }
};

export const deleteStudent = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    await service.deleteStudent(req.params.id);
    res.json({ success: true, message: "Deleted" });
  } catch (e: any) {
    next({ statusCode: 400, message: e.message });
  }
};

// ==================== PROGRAMS ====================
export const getPrograms = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const hod = await getHodContext(req);
    const data = await service.getPrograms(hod.departmentId);
    res.json({ success: true, data });
  } catch (e: any) {
    next({ statusCode: 400, message: e.message });
  }
};

export const createProgram = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const hod = await getHodContext(req);
    const data = await service.createProgram({
      ...req.body,
      departmentId: hod.departmentId,
      universityId: hod.universityId,
    });
    res.status(201).json({ success: true, data });
  } catch (e: any) {
    next({ statusCode: 400, message: e.message });
  }
};

export const updateProgram = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = await service.updateProgram(req.params.id, req.body);
    res.json({ success: true, data });
  } catch (e: any) {
    next({ statusCode: 400, message: e.message });
  }
};

export const deleteProgram = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    await service.deleteProgram(req.params.id);
    res.json({ success: true, message: "Deleted" });
  } catch (e: any) {
    next({ statusCode: 400, message: e.message });
  }
};

// ==================== UNITS ====================
export const getUnits = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const hod = await getHodContext(req);
    const data = await service.getUnits(hod.departmentId);
    res.json({ success: true, data });
  } catch (e: any) {
    next({ statusCode: 400, message: e.message });
  }
};

export const createUnit = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const hod = await getHodContext(req);
    const data = await service.createUnit({
      ...req.body,
      departmentId: hod.departmentId,
      universityId: hod.universityId,
    });
    res.status(201).json({ success: true, data });
  } catch (e: any) {
    next({ statusCode: 400, message: e.message });
  }
};

export const updateUnit = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = await service.updateUnit(req.params.id, req.body);
    res.json({ success: true, data });
  } catch (e: any) {
    next({ statusCode: 400, message: e.message });
  }
};

export const deleteUnit = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    await service.deleteUnit(req.params.id);
    res.json({ success: true, message: "Deleted" });
  } catch (e: any) {
    next({ statusCode: 400, message: e.message });
  }
};

// ==================== STUDY YEARS ====================
export const getStudyYears = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const hod = await getHodContext(req);
    const data = await service.getStudyYears(hod.universityId);
    res.json({ success: true, data });
  } catch (e: any) {
    next({ statusCode: 400, message: e.message });
  }
};

export const createStudyYear = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const hod = await getHodContext(req);
    const data = await service.createStudyYear({
      ...req.body,
      universityId: hod.universityId,
    });
    res.status(201).json({ success: true, data });
  } catch (e: any) {
    next({ statusCode: 400, message: e.message });
  }
};

export const updateStudyYear = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = await service.updateStudyYear(req.params.id, req.body);
    res.json({ success: true, data });
  } catch (e: any) {
    next({ statusCode: 400, message: e.message });
  }
};

export const deleteStudyYear = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    await service.deleteStudyYear(req.params.id);
    res.json({ success: true, message: "Deleted" });
  } catch (e: any) {
    next({ statusCode: 400, message: e.message });
  }
};

// ==================== SEMESTERS ====================
export const getSemesters = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const hod = await getHodContext(req);
    const data = await service.getSemesters(hod.universityId);
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
    const hod = await getHodContext(req);
    const data = await service.createSemester({
      ...req.body,
      universityId: hod.universityId,
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
    const data = await service.updateSemester(req.params.id, req.body);
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
    res.json({ success: true, message: "Deleted" });
  } catch (e: any) {
    next({ statusCode: 400, message: e.message });
  }
};

// ==================== TRACKING ====================
export const getLecturerTracking = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = await service.getLecturerTracking(req.params.id, req.query);
    res.json({ success: true, data });
  } catch (e: any) {
    next({ statusCode: 400, message: e.message });
  }
};

export const getStudentTracking = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = await service.getStudentTracking(req.params.id, req.query);
    res.json({ success: true, data });
  } catch (e: any) {
    next({ statusCode: 400, message: e.message });
  }
};

// ==================== CLASS RECORDS / ANALYTICS / SEARCH / REPORTS ====================
export const getClassRecords = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const hod = await getHodContext(req);
    const data = await service.getClassRecords(
      hod.departmentId,
      req.query.viewBy as string,
      req.query,
    );
    res.json({ success: true, data });
  } catch (e: any) {
    next({ statusCode: 400, message: e.message });
  }
};

export const getAnalytics = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const hod = await getHodContext(req);
    const data = await service.getAnalytics(hod.departmentId);
    res.json({ success: true, data });
  } catch (e: any) {
    next({ statusCode: 400, message: e.message });
  }
};

export const searchDepartment = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = await service.searchDepartment(
      req.user!.id,
      req.query.q as string,
    );
    res.json({ success: true, data });
  } catch (e: any) {
    next({ statusCode: 400, message: e.message });
  }
};

export const generateReport = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    res.json({ success: true, message: "Report generation endpoint ready" });
  } catch (e: any) {
    next({ statusCode: 400, message: e.message });
  }
};

// ==================== LECTURER UNIT ASSIGNMENT ====================

export const getAvailableUnits = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = await service.getAvailableUnits(req.user!.id, req.params.id);
    res.json({ success: true, data });
  } catch (e: any) {
    next({ statusCode: 400, message: e.message });
  }
};

export const getLecturerAssignedUnits = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = await service.getLecturerAssignedUnits(
      req.user!.id,
      req.params.id,
    );
    res.json({ success: true, data });
  } catch (e: any) {
    next({ statusCode: 400, message: e.message });
  }
};

export const assignUnits = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { unitIds } = req.body;
    if (!unitIds || !Array.isArray(unitIds) || unitIds.length === 0) {
      return next({ statusCode: 400, message: "Please provide unitIds array" });
    }
    const data = await service.assignUnitsToLecturer(
      req.user!.id,
      req.params.id,
      unitIds,
    );
    res.json({ success: true, data });
  } catch (e: any) {
    next({ statusCode: 400, message: e.message });
  }
};

export const unassignUnit = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = await service.unassignUnitFromLecturer(
      req.user!.id,
      req.params.id,
      req.params.unitId,
    );
    res.json({ success: true, data });
  } catch (e: any) {
    next({ statusCode: 400, message: e.message });
  }
};
