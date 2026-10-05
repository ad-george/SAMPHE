import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { getSemesterWeekBuckets } from "../../utils/helpers";

const prisma = new PrismaClient();

export class HodService {
  // --- Profile ---
  async getMe(hodId: string) {
    return prisma.hod.findUnique({
      where: { id: hodId },
      include: { department: true, university: true },
    });
  }

  async updateMe(hodId: string, data: any) {
    if (data.password) data.password = await bcrypt.hash(data.password, 10);
    return prisma.hod.update({ where: { id: hodId }, data });
  }

  // --- Dashboard Stats ---
  async getDashboardStats(hodId: string) {
    const hod = await prisma.hod.findUnique({ where: { id: hodId } });
    if (!hod) throw new Error("HOD not found");
    const deptId = hod.departmentId;

    const [
      lecturerCount,
      studentCount,
      unitCount,
      monthSessions,
      monthAttendance,
    ] = await Promise.all([
      prisma.lecturer.count({ where: { departmentId: deptId } }),
      prisma.student.count({ where: { departmentId: deptId } }),
      prisma.unit.count({ where: { departmentId: deptId } }),
      prisma.attendanceSession.count({
        where: {
          lecturer: { departmentId: deptId },
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      }),
      prisma.attendanceRecord.findMany({
        where: {
          session: { lecturer: { departmentId: deptId } },
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
        select: { status: true },
      }),
    ]);

    const presentCount = monthAttendance.filter(
      (r) => r.status === "PRESENT",
    ).length;
    const totalRecords = monthAttendance.length;
    const monthRate =
      totalRecords > 0
        ? ((presentCount / totalRecords) * 100).toFixed(1)
        : "0.0";

    return {
      lecturers: lecturerCount,
      students: studentCount,
      units: unitCount,
      monthClasses: monthSessions,
      monthOverall: monthRate,
    };
  }

  // --- Lecturers ---
  async getLecturers(deptId: string) {
    const lecturers = await prisma.lecturer.findMany({
      where: { departmentId: deptId },
      include: {
        department: true,
        assignments: {
          include: {
            unit: {
              include: {
                program: true,
                studyYear: true,
                semester: true,
              },
            },
          },
        },
      },
      orderBy: { fullName: "asc" },
    });

    // Transform to include units as a flat array
    return lecturers.map((l) => ({
      ...l,
      units: l.assignments.map((a) => a.unit),
    }));
  }

  async createLecturer(data: any) {
    const pwd = await bcrypt.hash(data.password, 10);
    return prisma.lecturer.create({
      data: {
        staffNumber: data.staffNumber,
        fullName: data.fullName,
        email: data.email || "",
        phone: data.phone || "",
        password: pwd,
        departmentId: data.departmentId,
        universityId: data.universityId,
        status: "ACTIVE",
      },
    });
  }

  // ============================================================
  // PROMOTE ALL STUDENTS
  // ============================================================

  async promoteAllToNextSemester(hodId: string, filters: any) {
    const hod = await prisma.hod.findUnique({ where: { id: hodId } });
    if (!hod) throw new Error("HOD not found");

    const where: any = { departmentId: hod.departmentId, archived: false };
    if (filters.programId) where.programId = filters.programId;
    if (filters.studyYearId) where.studyYearId = filters.studyYearId;
    if (filters.semesterId) where.semesterId = filters.semesterId;

    const students = await prisma.student.findMany({
      where,
      include: { studyYear: true, semester: true },
    });

    const studentIds = students.map((s) => s.id);
    return this.promoteToNextSemester(hodId, studentIds);
  }

  async promoteAllToNextStudyYear(hodId: string, filters: any) {
    const hod = await prisma.hod.findUnique({ where: { id: hodId } });
    if (!hod) throw new Error("HOD not found");

    const where: any = { departmentId: hod.departmentId, archived: false };
    if (filters.programId) where.programId = filters.programId;
    if (filters.studyYearId) where.studyYearId = filters.studyYearId;
    if (filters.semesterId) where.semesterId = filters.semesterId;

    const students = await prisma.student.findMany({
      where,
      include: { studyYear: true, semester: true },
    });

    const studentIds = students.map((s) => s.id);
    return this.promoteToNextStudyYear(hodId, studentIds);
  }

  // ============================================================
  // PROMOTION HISTORY
  // ============================================================

  async getPromotionHistory(hodId: string, studentId?: string) {
    const hod = await prisma.hod.findUnique({ where: { id: hodId } });
    if (!hod) throw new Error("HOD not found");

    const where: any = { departmentId: hod.departmentId };
    if (studentId) where.id = studentId;

    // Get students who have been updated recently (last 30 days)
    // and track their promotion history via audit logs or updates
    const students = await prisma.student.findMany({
      where: {
        ...where,
        updatedAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
      },
      include: {
        program: true,
        studyYear: true,
        semester: true,
      },
      orderBy: { updatedAt: "desc" },
      take: 50,
    });

    // Filter students who have been promoted (studyYear or semester changed)
    return students.map((s) => ({
      studentId: s.id,
      regNo: s.regNo,
      fullName: s.fullName,
      program: s.program?.name || "N/A",
      studyYear: s.studyYear?.name || "N/A",
      semester: s.semester?.name || "N/A",
      promotedAt: s.updatedAt,
    }));
  }

  async updateLecturer(id: string, data: any) {
    if (data.password) data.password = await bcrypt.hash(data.password, 10);
    return prisma.lecturer.update({ where: { id }, data });
  }

  async deleteLecturer(id: string) {
    return prisma.lecturer.delete({ where: { id } });
  }

  // --- Students ---
  async getStudents(deptId: string, filters: any) {
    const where: any = { departmentId: deptId, archived: false };
    if (filters.programId) where.programId = filters.programId;
    if (filters.studyYearId) where.studyYearId = filters.studyYearId;
    if (filters.semesterId) where.semesterId = filters.semesterId;
    return prisma.student.findMany({
      where,
      include: {
        program: true,
        studyYear: true,
        semester: true,
      },
      orderBy: { fullName: "asc" },
    });
  }

  async createStudent(data: any) {
    const pwd = data.password
      ? await bcrypt.hash(data.password, 10)
      : await bcrypt.hash(data.regNo, 10);

    // Create the student first
    const student = await prisma.student.create({
      data: {
        ...data,
        password: pwd,
        admissionYear:
          data.admissionYear || new Date().getFullYear().toString(),
      } as any,
    });

    // ✅ Find all units that match this student's program, studyYear, and semester
    const units = await prisma.unit.findMany({
      where: {
        programId: data.programId,
        studyYearId: data.studyYearId,
        semesterId: data.semesterId,
        departmentId: data.departmentId,
      },
      select: { id: true },
    });

    // ✅ Register the student to all matching units
    if (units.length > 0) {
      await prisma.student.update({
        where: { id: student.id },
        data: {
          registeredUnits: {
            connect: units.map((u) => ({ id: u.id })),
          },
        },
      });
    }

    // Return the student with registered units included
    return prisma.student.findUnique({
      where: { id: student.id },
      include: {
        program: true,
        studyYear: true,
        semester: true,
        registeredUnits: true,
      },
    });
  }

  async updateStudent(id: string, data: any) {
    if (data.password) data.password = await bcrypt.hash(data.password, 10);
    return prisma.student.update({ where: { id }, data });
  }

  async deleteStudent(id: string) {
    return prisma.student.delete({ where: { id } });
  }

  // --- BULK IMPORT STUDENTS (ROBUST) ---
   // --- BULK IMPORT STUDENTS (FAST) ---
  async bulkImportStudents(hodId: string, students: any[]) {
    const hod = await prisma.hod.findUnique({
      where: { id: hodId },
      include: { university: true, department: true },
    });
    if (!hod) throw new Error("HOD not found");

    // ============================================================
    // 1. PRELOAD ALL REFERENCE DATA (one batch)
    // ============================================================
    const [allPrograms, allYears, allSemesters] = await Promise.all([
      prisma.programme.findMany({ where: { universityId: hod.universityId } }),
      prisma.studyYear.findMany({ where: { universityId: hod.universityId } }),
      prisma.semester.findMany({ where: { universityId: hod.universityId } }),
    ]);

    const findBest = (list: any[], search: string, key = "name") => {
      const s = search?.toLowerCase().trim() || "";
      if (!s) return null;
      let m = list.find((x) => x[key].toLowerCase() === s);
      if (m) return m;
      m = list.find((x) => x[key].toLowerCase().includes(s));
      if (m) return m;
      m = list.find((x) => s.includes(x[key].toLowerCase()));
      if (m) return m;
      const words = s.split(/\s+/).filter((w) => w.length > 2);
      return (
        list.find((x) => words.some((w) => x[key].toLowerCase().includes(w))) ||
        null
      );
    };

    // ============================================================
    // 2. PRELOAD EXISTING REG NUMBERS (one query)
    // ============================================================
    const incomingRegNos = students
      .map((r) => r.regNo?.trim())
      .filter(Boolean);

    const existingStudents = await prisma.student.findMany({
      where: { regNo: { in: incomingRegNos } },
      select: { regNo: true },
    });
    const existingRegNos = new Set(existingStudents.map((s) => s.regNo));

    // ============================================================
    // 3. PRELOAD ALL UNITS IN DEPARTMENT (one query)
    //    Keyed by program|year|semester
    // ============================================================
    const allUnits = await prisma.unit.findMany({
      where: { departmentId: hod.departmentId },
      select: {
        id: true,
        programId: true,
        studyYearId: true,
        semesterId: true,
      },
    });
    const unitsByKey = new Map<string, string[]>();
    allUnits.forEach((u) => {
      const key = `${u.programId}|${u.studyYearId}|${u.semesterId}`;
      const arr = unitsByKey.get(key) || [];
      arr.push(u.id);
      unitsByKey.set(key, arr);
    });

    // ============================================================
    // 4. PREPARE ROWS (in memory)
    // ============================================================
    const results = {
      created: 0,
      skipped: 0,
      failed: 0,
      errors: [] as string[],
      importedStudents: [] as any[],
    };

    const toCreate: {
      regNo: string;
      fullName: string;
      email: string;
      password: string;
      programId: string;
      studyYearId: string;
      semesterId: string;
      universityId: string;
      departmentId: string;
      archived: boolean;
      admissionYear: string;
      unitIds: string[];
    }[] = [];

    for (const row of students) {
      try {
        if (
          !row.regNo ||
          !row.fullName ||
          !row.email ||
          !row.program ||
          !row.studyYear ||
          !row.semester
        ) {
          results.failed++;
          results.errors.push(
            `Row ${row.regNo || "?"}: Missing required fields`,
          );
          continue;
        }

        const regNo = row.regNo.trim();

        if (existingRegNos.has(regNo)) {
          results.skipped++;
          continue;
        }

        const program = findBest(allPrograms, row.program);
        let yearSearch = String(row.studyYear).trim();
        if (/^\d+$/.test(yearSearch)) yearSearch = `Year ${yearSearch}`;
        const studyYear = findBest(allYears, yearSearch);
        const semester = findBest(allSemesters, row.semester);

        if (!program || !studyYear || !semester) {
          results.failed++;
          const missing = [
            !program && "Program",
            !studyYear && "StudyYear",
            !semester && "Semester",
          ]
            .filter(Boolean)
            .join("/");
          results.errors.push(
            `Row ${regNo}: ${missing} not found (program='${row.program}', year='${row.studyYear}', sem='${row.semester}')`,
          );
          continue;
        }

        const unitKey = `${program.id}|${studyYear.id}|${semester.id}`;
        const unitIds = unitsByKey.get(unitKey) || [];

        // Prevent duplicate regNo within the same file
        if (toCreate.some((s) => s.regNo === regNo)) {
          results.skipped++;
          continue;
        }

        toCreate.push({
          regNo,
          fullName: row.fullName.trim(),
          email: row.email.trim(),
          password: "imported-no-login", // students don't log in
          programId: program.id,
          studyYearId: studyYear.id,
          semesterId: semester.id,
          universityId: hod.universityId,
          departmentId: hod.departmentId,
          archived: false,
          admissionYear: new Date().getFullYear().toString(),
          unitIds,
        });
      } catch (err: any) {
        results.failed++;
        results.errors.push(`Row ${row.regNo || "?"}: ${err.message}`);
      }
    }

    if (toCreate.length === 0) return results;

    // ============================================================
    // 5. BATCH CREATE STUDENTS (one query)
    // ============================================================
    const createData = toCreate.map(
      ({ unitIds, ...student }) => student,
    );

    await prisma.student.createMany({ data: createData });

    results.created = createData.length;
    toCreate.forEach((s) => {
      results.importedStudents.push({
        regNo: s.regNo,
        fullName: s.fullName,
      });
    });

    // ============================================================
    // 6. BATCH LINK STUDENTS ↔ UNITS (raw insert, one query)
    //    Join table: _StudentUnits (implicit m2m, A=Student, B=Unit)
    // ============================================================
    const allPairs: { studentRegNo: string; unitId: string }[] = [];
    toCreate.forEach((s) => {
      s.unitIds.forEach((unitId) => {
        allPairs.push({ studentRegNo: s.regNo, unitId });
      });
    });

    if (allPairs.length > 0) {
      // Fetch the newly created student IDs in one query
      const newStudents = await prisma.student.findMany({
        where: { regNo: { in: toCreate.map((s) => s.regNo) } },
        select: { id: true, regNo: true },
      });
      const idByRegNo = new Map(newStudents.map((s) => [s.regNo, s.id]));

      // Build VALUES for raw insert
      const values = allPairs
        .map((p) => {
          const sid = idByRegNo.get(p.studentRegNo);
          if (!sid) return null;
          return `('${sid}', '${p.unitId}')`;
        })
        .filter(Boolean)
        .join(",");

      if (values) {
        await prisma.$executeRawUnsafe(
          `INSERT INTO "_StudentUnits" ("A", "B") VALUES ${values} ON CONFLICT DO NOTHING`,
        );
      }
    }

    return results;
  }

  // --- PROMOTE TO NEXT SEMESTER ---
  async promoteToNextSemester(hodId: string, studentIds: string[]) {
    const hod = await prisma.hod.findUnique({ where: { id: hodId } });
    if (!hod) throw new Error("HOD not found");

    const results = { promoted: 0, failed: 0, errors: [] as string[] };

    for (const id of studentIds) {
      try {
        const student = await prisma.student.findUnique({
          where: { id },
          include: { studyYear: true, semester: true },
        });
        if (!student) {
          results.failed++;
          continue;
        }

        const currentYearName = student.studyYear?.name || "Year 1";
        const currentSemName = student.semester?.name || "Semester 1";
        const yearMatch = currentYearName.match(/(\d+)/);
        const semMatch = currentSemName.match(/(\d+)/);
        const yearNum = yearMatch ? parseInt(yearMatch[1]) : 1;
        const semNum = semMatch ? parseInt(semMatch[1]) : 1;

        let nextYearName: string;
        let nextSemName: string;

        if (semNum === 1) {
          nextSemName = `Semester 2`;
          nextYearName = currentYearName;
        } else {
          nextSemName = `Semester 1`;
          nextYearName = `Year ${yearNum + 1}`;
        }

        const [nextYear, nextSem] = await Promise.all([
          prisma.studyYear.findFirst({
            where: {
              name: { contains: nextYearName, mode: "insensitive" },
              universityId: hod.universityId,
            },
          }),
          prisma.semester.findFirst({
            where: {
              name: { contains: nextSemName, mode: "insensitive" },
              universityId: hod.universityId,
            },
          }),
        ]);

        if (!nextYear || !nextSem) {
          results.errors.push(`${student.regNo}: Next year/semester not found`);
          results.failed++;
          continue;
        }

        await prisma.student.update({
          where: { id },
          data: { studyYearId: nextYear.id, semesterId: nextSem.id },
        });
        results.promoted++;
      } catch (err: any) {
        results.failed++;
        results.errors.push(err.message);
      }
    }
    return results;
  }

  // --- PROMOTE TO NEXT STUDY YEAR ---
  async promoteToNextStudyYear(hodId: string, studentIds: string[]) {
    const hod = await prisma.hod.findUnique({ where: { id: hodId } });
    if (!hod) throw new Error("HOD not found");

    const results = { promoted: 0, failed: 0, errors: [] as string[] };

    for (const id of studentIds) {
      try {
        const student = await prisma.student.findUnique({
          where: { id },
          include: { studyYear: true },
        });
        if (!student) {
          results.failed++;
          continue;
        }

        const yearMatch = (student.studyYear?.name || "Year 1").match(/(\d+)/);
        const nextYearName = `Year ${(yearMatch ? parseInt(yearMatch[1]) : 1) + 1}`;

        const [nextYear, sem1] = await Promise.all([
          prisma.studyYear.findFirst({
            where: {
              name: { contains: nextYearName, mode: "insensitive" },
              universityId: hod.universityId,
            },
          }),
          prisma.semester.findFirst({
            where: {
              name: { contains: "Semester 1", mode: "insensitive" },
              universityId: hod.universityId,
            },
          }),
        ]);

        if (!nextYear) {
          results.errors.push(`${student.regNo}: ${nextYearName} not found`);
          results.failed++;
          continue;
        }

        await prisma.student.update({
          where: { id },
          data: {
            studyYearId: nextYear.id,
            semesterId: sem1?.id || student.semesterId,
          },
        });
        results.promoted++;
      } catch (err: any) {
        results.failed++;
        results.errors.push(err.message);
      }
    }
    return results;
  }

  // --- ARCHIVE / UNARCHIVE ---
  async archiveStudent(
    hodId: string,
    studentId: string,
    archiveUntil?: string,
  ) {
    const hod = await prisma.hod.findUnique({ where: { id: hodId } });
    if (!hod) throw new Error("HOD not found");

    return prisma.student.update({
      where: { id: studentId },
      data: {
        archived: true,
        archivedAt: new Date(),
        archiveUntil: archiveUntil ? new Date(archiveUntil) : null,
      },
    });
  }

  async unarchiveStudent(hodId: string, studentId: string) {
    const hod = await prisma.hod.findUnique({ where: { id: hodId } });
    if (!hod) throw new Error("HOD not found");

    return prisma.student.update({
      where: { id: studentId },
      data: { archived: false, archivedAt: null, archiveUntil: null },
    });
  }

  async getArchivedStudents(hodId: string, filters: any) {
    const hod = await prisma.hod.findUnique({ where: { id: hodId } });
    if (!hod) throw new Error("HOD not found");

    const where: any = { departmentId: hod.departmentId, archived: true };
    if (filters.programId) where.programId = filters.programId;
    if (filters.studyYearId) where.studyYearId = filters.studyYearId;

    return prisma.student.findMany({
      where,
      include: { program: true, studyYear: true, semester: true },
      orderBy: { archivedAt: "desc" },
    });
  }

  async permanentlyDeleteStudent(hodId: string, studentId: string) {
    const hod = await prisma.hod.findUnique({ where: { id: hodId } });
    if (!hod) throw new Error("HOD not found");

    await prisma.attendanceRecord.deleteMany({ where: { studentId } });
    await prisma.student.delete({ where: { id: studentId } });
    return { message: "Permanently deleted" };
  }

  // --- BULK IMPORT UNITS ---
  async bulkImportUnits(hodId: string, units: any[]) {
    const hod = await prisma.hod.findUnique({
      where: { id: hodId },
      include: { university: true, department: true },
    });
    if (!hod) throw new Error("HOD not found");

    const [allPrograms, allYears, allSemesters] = await Promise.all([
      prisma.programme.findMany({ where: { universityId: hod.universityId } }),
      prisma.studyYear.findMany({ where: { universityId: hod.universityId } }),
      prisma.semester.findMany({ where: { universityId: hod.universityId } }),
    ]);

    const findBest = (list: any[], search: string, key: string = "name") => {
      const s = search.toLowerCase().trim();
      if (!s) return null;
      let m = list.find((x) => x[key].toLowerCase() === s);
      if (m) return m;
      m = list.find((x) => x[key].toLowerCase().includes(s));
      if (m) return m;
      m = list.find((x) => s.includes(x[key].toLowerCase()));
      if (m) return m;
      const words = s.split(/\s+/).filter((w) => w.length > 2);
      m = list.find((x) => words.some((w) => x[key].toLowerCase().includes(w)));
      return m || null;
    };

    const results = {
      created: 0,
      skipped: 0,
      failed: 0,
      errors: [] as string[],
    };

    for (const row of units) {
      try {
        if (
          !row.code ||
          !row.name ||
          !row.program ||
          !row.studyYear ||
          !row.semester
        ) {
          results.failed++;
          results.errors.push(`Row: Missing required fields`);
          continue;
        }

        const program = findBest(allPrograms, row.program);
        const studyYear = findBest(allYears, row.studyYear);
        const semester = findBest(allSemesters, row.semester);

        if (!program || !studyYear || !semester) {
          results.failed++;
          const missing = [
            !program && "Program",
            !studyYear && "StudyYear",
            !semester && "Semester",
          ]
            .filter(Boolean)
            .join("/");
          results.errors.push(
            `Row ${row.code}: ${missing} not found (program='${row.program}', year='${row.studyYear}', sem='${row.semester}')`,
          );
          continue;
        }

        // Duplicate: same code AND program AND year AND semester
        const exists = await prisma.unit.findFirst({
          where: {
            code: row.code.trim(),
            programId: program.id,
            studyYearId: studyYear.id,
            semesterId: semester.id,
            departmentId: hod.departmentId,
          },
        });
        if (exists) {
          results.skipped++;
          continue;
        }

        await prisma.unit.create({
          data: {
            code: row.code.trim(),
            name: row.name.trim(),
            programId: program.id,
            studyYearId: studyYear.id,
            semesterId: semester.id,
            universityId: hod.universityId,
            departmentId: hod.departmentId,
          } as any,
        });

        results.created++;
      } catch (err: any) {
        results.failed++;
        results.errors.push(`Row ${row.code || "?"}: ${err.message}`);
      }
    }

    return results;
  }

  // --- Lecturer Unit Assignment ---
  async getAvailableUnits(hodId: string, lecturerId: string) {
    const hod = await prisma.hod.findUnique({ where: { id: hodId } });
    if (!hod) throw new Error("HOD not found");

    // Get units already assigned to this lecturer
    const assignedUnitIds = await prisma.lecturerUnitAssignment.findMany({
      where: { lecturerId },
      select: { unitId: true },
    });

    const assignedIds = assignedUnitIds.map((a) => a.unitId);

    // Get all units in the department not assigned to this lecturer
    return prisma.unit.findMany({
      where: {
        departmentId: hod.departmentId,
        id: { notIn: assignedIds },
      },
      include: {
        program: true,
        studyYear: true,
        semester: true,
      },
      orderBy: { name: "asc" },
    });
  }

  async assignUnitsToLecturer(
    hodId: string,
    lecturerId: string,
    unitIds: string[],
  ) {
    const hod = await prisma.hod.findUnique({ where: { id: hodId } });
    if (!hod) throw new Error("HOD not found");

    const lecturer = await prisma.lecturer.findUnique({
      where: { id: lecturerId },
    });
    if (!lecturer) throw new Error("Lecturer not found");

    const results = { assigned: 0, failed: 0, errors: [] as string[] };

    for (const unitId of unitIds) {
      try {
        // Check if unit exists in department
        const unit = await prisma.unit.findFirst({
          where: { id: unitId, departmentId: hod.departmentId },
        });
        if (!unit) {
          results.failed++;
          results.errors.push(`Unit ${unitId} not found in your department`);
          continue;
        }

        // Check if already assigned
        const existing = await prisma.lecturerUnitAssignment.findFirst({
          where: { lecturerId, unitId },
        });
        if (existing) {
          results.failed++;
          results.errors.push(`Unit already assigned to this lecturer`);
          continue;
        }

        await prisma.lecturerUnitAssignment.create({
          data: {
            lecturerId,
            unitId,
          },
        });
        results.assigned++;
      } catch (err: any) {
        results.failed++;
        results.errors.push(err.message);
      }
    }

    return results;
  }

  async unassignUnitFromLecturer(
    hodId: string,
    lecturerId: string,
    unitId: string,
  ) {
    const hod = await prisma.hod.findUnique({ where: { id: hodId } });
    if (!hod) throw new Error("HOD not found");

    const assignment = await prisma.lecturerUnitAssignment.findFirst({
      where: {
        lecturerId,
        unitId,
        lecturer: { departmentId: hod.departmentId },
      },
    });

    if (!assignment) {
      throw new Error("Unit not assigned to this lecturer");
    }

    await prisma.lecturerUnitAssignment.delete({
      where: { id: assignment.id },
    });

    return { message: "Unit unassigned successfully" };
  }

  async getLecturerAssignedUnits(hodId: string, lecturerId: string) {
    const hod = await prisma.hod.findUnique({ where: { id: hodId } });
    if (!hod) throw new Error("HOD not found");

    return prisma.lecturerUnitAssignment.findMany({
      where: {
        lecturerId,
        lecturer: { departmentId: hod.departmentId },
      },
      include: {
        unit: {
          include: {
            program: true,
            studyYear: true,
            semester: true,
          },
        },
      },
    });
  }

  // --- Programs ---
  async getPrograms(deptId: string) {
    return prisma.programme.findMany({
      where: { departmentId: deptId },
      orderBy: { name: "asc" },
    });
  }
  async createProgram(data: any) {
    const programData = {
      ...data,
      duration: data.duration || 4,
    };
    return prisma.programme.create({ data: programData });
  }
  async updateProgram(id: string, data: any) {
    return prisma.programme.update({ where: { id }, data });
  }
  async deleteProgram(id: string) {
    return prisma.programme.delete({ where: { id } });
  }

  // --- Units ---
  async getUnits(deptId: string) {
    return prisma.unit.findMany({
      where: { departmentId: deptId },
      include: {
        program: true,
        studyYear: true,
        semester: true,
        lecturers: true,
      },
      orderBy: { name: "asc" },
    });
  }
  async createUnit(data: any) {
    return prisma.unit.create({ data });
  }
  async updateUnit(id: string, data: any) {
    return prisma.unit.update({ where: { id }, data });
  }
  async deleteUnit(id: string) {
    return prisma.unit.delete({ where: { id } });
  }

  // --- Study Years ---
  async getStudyYears(universityId: string) {
    return prisma.studyYear.findMany({
      where: { universityId },
      orderBy: { name: "asc" },
    });
  }
  async createStudyYear(data: any) {
    return prisma.studyYear.create({ data });
  }
  async updateStudyYear(id: string, data: any) {
    return prisma.studyYear.update({ where: { id }, data });
  }
  async deleteStudyYear(id: string) {
    return prisma.studyYear.delete({ where: { id } });
  }

  // --- Semesters ---
  async getSemesters(universityId: string) {
    return prisma.semester.findMany({
      where: { universityId },
      include: { studyYear: true },
      orderBy: { name: "asc" },
    });
  }
  async createSemester(data: any) {
    return prisma.semester.create({ data });
  }
  async updateSemester(id: string, data: any) {
    return prisma.semester.update({ where: { id }, data });
  }
  async deleteSemester(id: string) {
    return prisma.semester.delete({ where: { id } });
  }

  // --- Lecturer Tracking ---
  async getLecturerTracking(lecturerId: string, filters: any) {
    const lecturer = await prisma.lecturer.findUnique({
      where: { id: lecturerId },
      include: {
        department: true,
        assignments: {
          include: {
            unit: {
              include: {
                program: true,
                studyYear: true,
                semester: true,
              },
            },
          },
        },
      },
    });
    if (!lecturer) throw new Error("Lecturer not found");

    // Extract units from assignments
    const units = lecturer.assignments.map((a) => a.unit);

    const sessionWhere: any = { lecturerId };
    if (filters.unitId) sessionWhere.unitId = filters.unitId;

    const sessions = await prisma.attendanceSession.findMany({
      where: sessionWhere,
      include: { unit: true, records: true },
      orderBy: { sessionDate: "desc" },
    });

    const unitStats = units.map((u) => {
      const unitSessions = sessions.filter((s) => s.unitId === u.id);
      const total = unitSessions.length;
      const totalRecords = unitSessions.reduce(
        (sum, s) => sum + s.records.length,
        0,
      );
      const presentRecords = unitSessions.reduce(
        (sum, s) =>
          sum + s.records.filter((r) => r.status === "PRESENT").length,
        0,
      );
      const avg =
        totalRecords > 0
          ? ((presentRecords / totalRecords) * 100).toFixed(1)
          : "0.0";
      return { unitId: u.id, unitName: u.name, sessions: total, avgRate: avg };
    });

    const allRecords = sessions.reduce((sum, s) => sum + s.records.length, 0);
    const allPresent = sessions.reduce(
      (sum, s) => sum + s.records.filter((r) => r.status === "PRESENT").length,
      0,
    );
    const overallAvg =
      allRecords > 0 ? ((allPresent / allRecords) * 100).toFixed(1) : "0.0";

    return {
      lecturer: {
        ...lecturer,
        units: units, // ✅ Add units to lecturer object
      },
      totalSessions: sessions.length,
      overallAvg,
      unitStats,
      lastSession: sessions[0] || null,
      sessions,
    };
  }

  // --- Student Tracking ---
  async getStudentTracking(studentId: string, filters: any) {
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        program: true,
        studyYear: true,
        semester: true,
        registeredUnits: true,
      },
    });
    if (!student) throw new Error("Student not found");

    const recordWhere: any = { studentId };
    if (filters.unitId) {
      recordWhere.session = { unitId: filters.unitId };
    }

    const records = await prisma.attendanceRecord.findMany({
      where: recordWhere,
      include: { session: { include: { unit: true, lecturer: true } } },
      orderBy: { createdAt: "desc" },
    });

    const attended = records.filter((r) => r.status === "PRESENT").length;
    const missed = records.filter((r) => r.status === "ABSENT").length;
    const overallRate =
      records.length > 0
        ? ((attended / records.length) * 100).toFixed(1)
        : "0.0";

    const unitBreakdown = student.registeredUnits.map((u) => {
      const unitRecords = records.filter((r) => r.session.unitId === u.id);
      const uAttended = unitRecords.filter(
        (r) => r.status === "PRESENT",
      ).length;
      const uMissed = unitRecords.filter((r) => r.status === "ABSENT").length;
      const uRate =
        unitRecords.length > 0
          ? ((uAttended / unitRecords.length) * 100).toFixed(1)
          : "0.0";
      return {
        unitId: u.id,
        unitName: u.name,
        attended: uAttended,
        missed: uMissed,
        rate: uRate,
        missedDates: unitRecords
          .filter((r) => r.status === "ABSENT")
          .map((r) => r.session.sessionDate),
      };
    });

    return {
      student,
      totalAttended: attended,
      totalMissed: missed,
      overallRate,
      unitBreakdown,
      records,
    };
  }

  // --- Class Records ---
  async getClassRecords(deptId: string, filters: any) {
    const hod = await prisma.hod.findFirst({
      where: { departmentId: deptId },
      select: { universityId: true },
    });
    const universityId = hod?.universityId;

    // ============================================================
    // SEMESTER RESOLUTION
    // ============================================================
    const activeYear = await prisma.academicYear.findFirst({
      where: { status: "ACTIVE", archived: false },
    });
    const currentSemester = universityId
      ? await prisma.semester.findFirst({
          where: {
            universityId,
            startDate: { lte: new Date() },
            endDate: { gte: new Date() },
          },
          orderBy: { startDate: "desc" },
        })
      : null;
    const semesterStart = currentSemester?.startDate
      ? new Date(currentSemester.startDate)
      : activeYear?.startDate
        ? new Date(activeYear.startDate)
        : new Date(0);
    const semesterEnd = currentSemester?.endDate
      ? new Date(currentSemester.endDate)
      : activeYear?.endDate
        ? new Date(activeYear.endDate)
        : new Date();

    const baseWhere: any = {
      unit: { departmentId: deptId },
      status: { not: "ACTIVE" },
      sessionDate: { gte: semesterStart, lte: semesterEnd },
    };

    if (filters.unitId) baseWhere.unitId = filters.unitId;
    if (filters.programId)
      baseWhere.unit = { ...baseWhere.unit, programId: filters.programId };
    if (filters.dateFrom)
      baseWhere.sessionDate.gte = new Date(filters.dateFrom);
    if (filters.dateTo)
      baseWhere.sessionDate.lte = new Date(filters.dateTo);

    const sessions = await prisma.attendanceSession.findMany({
      where: baseWhere,
      include: {
        unit: {
          include: {
            program: true,
            studyYear: true,
            semester: true,
          },
        },
        lecturer: {
          include: {
            university: true,
            department: { include: { faculty: true } },
          },
        },
        records: {
          include: {
            student: {
              include: {
                program: true,
                studyYear: true,
                semester: true,
              },
            },
          },
        },
      },
      orderBy: { sessionDate: "desc" },
    });

    // ============================================================
    // ATTACH WEEK NUMBER (Mon–Sun from semester start)
    // ============================================================
    const weekBuckets = getSemesterWeekBuckets(semesterStart, semesterEnd);

    return sessions.map((s) => {
      const d = new Date(s.sessionDate);
      const idx = weekBuckets.findIndex(
        (w) => d >= w.start && d <= w.end,
      );
      return {
        ...s,
        weekNumber: idx >= 0 ? idx + 1 : null,
      };
    });
  }

  async getStudentClassRecords(deptId: string, filters: any) {
    const studentWhere: any = { departmentId: deptId };
    if (filters.studentRegNo)
      studentWhere.regNo = {
        contains: filters.studentRegNo,
        mode: "insensitive",
      };

    const students = await prisma.student.findMany({
      where: studentWhere,
      include: {
        records: {
          include: { session: { include: { unit: true, lecturer: true } } },
          orderBy: { createdAt: "desc" },
        },
      },
      take: 20,
    });
    return students;
  }

   async getFullDashboard(hodId: string) {
    const hod = await prisma.hod.findUnique({ where: { id: hodId } });
    if (!hod) throw new Error("HOD not found");
    const deptId = hod.departmentId;

    // ============================================================
    // 1. SEMESTER / ACADEMIC YEAR RESOLUTION
    // ============================================================
    const activeYear = await prisma.academicYear.findFirst({
      where: { status: "ACTIVE", archived: false },
    });

    const currentSemester = await prisma.semester.findFirst({
      where: {
        universityId: hod.universityId,
        startDate: { lte: new Date() },
        endDate: { gte: new Date() },
      },
      orderBy: { startDate: "desc" },
    });

    const semesterStart = currentSemester?.startDate
      ? new Date(currentSemester.startDate)
      : activeYear?.startDate
        ? new Date(activeYear.startDate)
        : new Date();
    const semesterEnd = currentSemester?.endDate
      ? new Date(currentSemester.endDate)
      : activeYear?.endDate
        ? new Date(activeYear.endDate)
        : new Date();

    // Mon–Sun week buckets from semester dates
    const weekBuckets = getSemesterWeekBuckets(semesterStart, semesterEnd);

    // ============================================================
    // 2. SINGLE BATCH FETCH (all parallel, no N+1)
    // ============================================================
    const [
      programmeCount,
      lecturerCount,
      studentCount,
      unitCount,
      monthSessionsCount,
      deptSessions,
      programs,
      units,
      studentsWithRecords,
    ] = await Promise.all([
      prisma.programme.count({ where: { departmentId: deptId } }),
      prisma.lecturer.count({ where: { departmentId: deptId } }),
      prisma.student.count({ where: { departmentId: deptId, archived: false } }),
      prisma.unit.count({ where: { departmentId: deptId } }),
      prisma.attendanceSession.count({
        where: {
          lecturer: { departmentId: deptId },
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      }),
      // All sessions in dept, semester-scoped, with records
         prisma.attendanceSession.findMany({
        where: {
          lecturer: { departmentId: deptId },
          status: { not: "ACTIVE" },
          sessionDate: { gte: semesterStart, lte: semesterEnd },
        },
        select: {
          id: true,
          unitId: true,
          lecturerId: true,
          totalStudents: true,
          sessionDate: true,
          unit: {
            select: {
              id: true,
              name: true,
              programId: true,
              semesterId: true,
              program: { select: { id: true, name: true } },
            },
          },
          lecturer: { select: { id: true, fullName: true } },
          records: { select: { studentId: true, status: true } },
        },
        orderBy: { sessionDate: "desc" },
      }),
      prisma.programme.findMany({
        where: { departmentId: deptId },
        select: { id: true, name: true },
      }),
          prisma.unit.findMany({
        where: { departmentId: deptId },
        select: { id: true, programId: true, semesterId: true, studyYearId: true },
      }),
      // Students + their PRESENT records in dept sessions, semester-scoped
      prisma.student.findMany({
        where: { departmentId: deptId, archived: false },
        select: {
          id: true,
          fullName: true,
          regNo: true,
          programId: true,
          studyYearId: true,
          semesterId: true,
          program: { select: { name: true } },
        },
      }),
    ]);

    // ============================================================
    // 3. DERIVED STATS
    // ============================================================
    const sessionsHeld = deptSessions.length;

    // Per-program session counts
    const programSessionCount = new Map<string, number>();
    deptSessions.forEach((s) => {
      const pid = s.unit?.programId;
      if (!pid) return;
      programSessionCount.set(pid, (programSessionCount.get(pid) || 0) + 1);
    });

    // Program doughnut = sessions held / sessions expected
    // Expected = (#weeks in semester so far) × (units in program)
    const now = new Date();
    const weeksElapsed = weekBuckets.filter((w) => w.start <= now).length;

    const programStats = programs.map((p) => {
      const programUnits = units.filter((u) => u.programId === p.id);
      const expected = programUnits.length * weeksElapsed;
      const held = programSessionCount.get(p.id) || 0;
      const rate =
        expected > 0 ? ((held / expected) * 100).toFixed(1) : "0.0";
      return { name: p.name, rate };
    });

    // Overall program delivery % (big number under doughnut)
    const totalExpected = units.length * weeksElapsed;
    const avgAttendance =
      totalExpected > 0
        ? ((sessionsHeld / totalExpected) * 100).toFixed(1)
        : "0.0";

    // ============================================================
    // 4. RECENT CLASSES (5 most recent)
    // ============================================================
    const recentClasses = deptSessions.slice(0, 5).map((c) => {
      const present = c.records.filter((r) => r.status === "PRESENT").length;
      const total = c.totalStudents || 0;
      return {
        date: c.sessionDate,
        unit: c.unit?.name || "",
        lecturer: c.lecturer?.fullName || "",
        rate: total > 0 ? Math.round((present / total) * 100) : 0,
        present,
        total,
      };
    });

    // ============================================================
    // 5. WEEKLY TREND (Present / Expected per Mon–Sun week)
    // ============================================================
    const weeklyTrend = weekBuckets.map((bucket) => {
      const weekSessions = deptSessions.filter((s) => {
        const d = new Date(s.sessionDate);
        return d >= bucket.start && d <= bucket.end;
      });

      let totalPresent = 0;
      let totalExpectedInWeek = 0;
      weekSessions.forEach((s) => {
        totalPresent += s.records.filter((r) => r.status === "PRESENT").length;
        totalExpectedInWeek += s.totalStudents || 0;
      });

      const rate =
        totalExpectedInWeek > 0
          ? Math.round((totalPresent / totalExpectedInWeek) * 100)
          : 0;

      return { week: bucket.label, rate };
    });

    // ============================================================
    // 6. LOW ATTENDANCE ALERT (per-student, session-based, <75%)
    // ============================================================
    // For each student: find sessions whose unit matches their program+year+sem,
    // count how many of those they attended (PRESENT).
    const studentIds = studentsWithRecords.map((s) => s.id);
    const studentRecordMap = new Map<string, Set<string>>();
    deptSessions.forEach((s) => {
      s.records.forEach((r) => {
        if (r.status !== "PRESENT") return;
        const set = studentRecordMap.get(r.studentId) || new Set<string>();
        set.add(s.id);
        studentRecordMap.set(r.studentId, set);
      });
    });

    // Fetch studyYearId for units in one query
       // Build unit-year map from already-fetched units
    const unitYearMap = new Map<string, string>();
    units.forEach((u) => unitYearMap.set(u.id, u.studyYearId));

    // Build sessions-per-key
    const sessionsByKey = new Map<
      string,
      { sessionId: string; unitId: string }[]
    >();
    deptSessions.forEach((s) => {
      const pid = s.unit?.programId;
      const sid = s.unit?.semesterId;
      const yid = unitYearMap.get(s.unitId);
      if (!pid || !sid || !yid) return;
      const key = `${pid}|${yid}|${sid}`;
      const arr = sessionsByKey.get(key) || [];
      arr.push({ sessionId: s.id, unitId: s.unitId });
      sessionsByKey.set(key, arr);
    });

    type LowAttendee = {
      id: string;
      name: string;
      regNo: string;
      rate: string;
      program: string;
    };

    const lowAttendees: LowAttendee[] = studentsWithRecords
      .map((s): (LowAttendee & { _skip: boolean }) => {
        const key = `${s.programId}|${s.studyYearId}|${s.semesterId}`;
        const relevant = sessionsByKey.get(key) || [];
        const totalSessions = relevant.length;
        if (totalSessions === 0) {
          return {
            id: s.id,
            name: s.fullName,
            regNo: s.regNo,
            rate: "0",
            program: s.program?.name || "",
            _skip: true,
          };
        }
        const attendedSet = studentRecordMap.get(s.id) || new Set<string>();
        const present = relevant.filter((r) =>
          attendedSet.has(r.sessionId),
        ).length;
        const rate = (present / totalSessions) * 100;
        return {
          id: s.id,
          name: s.fullName,
          regNo: s.regNo,
          rate: rate.toFixed(0),
          program: s.program?.name || "",
          _skip: false,
        };
      })
      .filter((s) => !s._skip && parseFloat(s.rate) < 75)
      .sort((a, b) => parseFloat(a.rate) - parseFloat(b.rate))
      .slice(0, 6)
      .map(({ _skip, ...rest }) => rest);

    // ============================================================
    // 7. SEMESTER SUMMARY
    // ============================================================
    // Total classes expected across semester = units × total weeks
    const totalWeeks = weekBuckets.length;
    const totalClassesExpected = units.length * totalWeeks;
    const totalAttended = sessionsHeld;
    const totalMissed = Math.max(0, totalClassesExpected - totalAttended);

    // Avg Student Attendance = Present / Expected (session.totalStudents)
    let semesterTotalPresent = 0;
    let semesterTotalExpected = 0;
    deptSessions.forEach((s) => {
      semesterTotalPresent += s.records.filter(
        (r) => r.status === "PRESENT",
      ).length;
      semesterTotalExpected += s.totalStudents || 0;
    });
    const avgStudentAttendance =
      semesterTotalExpected > 0
        ? ((semesterTotalPresent / semesterTotalExpected) * 100).toFixed(1)
        : "0.0";

    // ============================================================
    // 8. RETURN
    // ============================================================
    return {
      stats: {
        programs: programmeCount,
        lecturers: lecturerCount,
        students: studentCount,
        units: unitCount,
        monthClasses: monthSessionsCount,
      },
      currentSemester: currentSemester
        ? { name: currentSemester.name }
        : { name: activeYear?.name || "Current" },
      programStats,
      weeklyTrend,
      recentClasses,
      lowAttendees,
      summary: {
        totalClasses: totalClassesExpected,
        totalAttended,
        totalMissed,
        avgAttendance,
        avgStudentAttendance,
      },
    };
  }

  // --- Analytics ---
  async getAnalytics(hodId: string) {
    const hod = await prisma.hod.findUnique({ where: { id: hodId } });
    if (!hod) throw new Error("HOD not found");
    const deptId = hod.departmentId;

    // ============================================================
    // SEMESTER RESOLUTION
    // ============================================================
    const activeYear = await prisma.academicYear.findFirst({
      where: { status: "ACTIVE", archived: false },
    });
    const currentSemester = await prisma.semester.findFirst({
      where: {
        universityId: hod.universityId,
        startDate: { lte: new Date() },
        endDate: { gte: new Date() },
      },
      orderBy: { startDate: "desc" },
    });
    const semesterStart = currentSemester?.startDate
      ? new Date(currentSemester.startDate)
      : activeYear?.startDate
        ? new Date(activeYear.startDate)
        : new Date();
    const semesterEnd = currentSemester?.endDate
      ? new Date(currentSemester.endDate)
      : activeYear?.endDate
        ? new Date(activeYear.endDate)
        : new Date();

    const weekBuckets = getSemesterWeekBuckets(semesterStart, semesterEnd);
    const now = new Date();
    const weeksElapsed = weekBuckets.filter((w) => w.start <= now).length;

    // ============================================================
    // BATCH FETCH (parallel, no N+1)
    // ============================================================
    const [units, lecturers, programs, allSessions, students] =
      await Promise.all([
        prisma.unit.findMany({
          where: { departmentId: deptId },
          select: { id: true, programId: true },
        }),
        prisma.lecturer.findMany({
          where: { departmentId: deptId },
          select: {
            id: true,
            fullName: true,
            assignments: { select: { unitId: true } },
          },
        }),
        prisma.programme.findMany({
          where: { departmentId: deptId },
          select: { id: true, name: true },
        }),
        prisma.attendanceSession.findMany({
          where: {
            lecturer: { departmentId: deptId },
            status: { not: "ACTIVE" },
            sessionDate: { gte: semesterStart, lte: semesterEnd },
          },
          select: {
            id: true,
            unitId: true,
            lecturerId: true,
            records: { select: { studentId: true, status: true } },
          },
        }),
        prisma.student.findMany({
          where: { departmentId: deptId, archived: false },
          select: {
            id: true,
            regNo: true,
            fullName: true,
            programId: true,
            studyYearId: true,
            semesterId: true,
            program: { select: { name: true } },
          },
        }),
      ]);

    // ============================================================
    // 1. DEPARTMENT RATE = sessionsHeld / (units × weeksElapsed)
    // ============================================================
    const totalExpected = units.length * weeksElapsed;
    const departmentRate =
      totalExpected > 0
        ? ((allSessions.length / totalExpected) * 100).toFixed(1)
        : "0.0";

    // ============================================================
    // 2. PROGRAM COMPARISON
    // ============================================================
    const programSessionCount = new Map<string, number>();
    allSessions.forEach((s) => {
      const unit = units.find((u) => u.id === s.unitId);
      if (!unit) return;
      programSessionCount.set(
        unit.programId,
        (programSessionCount.get(unit.programId) || 0) + 1,
      );
    });

    const programStats = programs.map((p) => {
      const programUnits = units.filter((u) => u.programId === p.id);
      const expected = programUnits.length * weeksElapsed;
      const held = programSessionCount.get(p.id) || 0;
      const rate =
        expected > 0 ? ((held / expected) * 100).toFixed(1) : "0.0";
      const studentCount = students.filter(
        (s) => s.programId === p.id,
      ).length;
      return {
        programId: p.id,
        programName: p.name,
        studentCount,
        rate,
        sessionsHeld: held,
        sessionsExpected: expected,
      };
    });

    // ============================================================
    // 3. LECTURER PERFORMANCE (assigned units × weeksElapsed)
    // ============================================================
    const lecturerStats = lecturers
      .map((l) => {
        const assignedUnitCount = l.assignments.length;
        const expected = assignedUnitCount * weeksElapsed;
        const held = allSessions.filter(
          (s) => s.lecturerId === l.id,
        ).length;
        const rate =
          expected > 0 ? ((held / expected) * 100).toFixed(1) : "0.0";
        return {
          lecturerId: l.id,
          lecturerName: l.fullName,
          sessionCount: held,
          rate,
        };
      })
      .filter((l) => l.sessionCount > 0)
      .sort((a, b) => parseFloat(b.rate) - parseFloat(a.rate));

    // ============================================================
    // 4. WORST PERFORMING UNITS = sessionsHeld / weeksElapsed
    // ============================================================
    const unitSessionCount = new Map<string, number>();
    allSessions.forEach((s) => {
      unitSessionCount.set(
        s.unitId,
        (unitSessionCount.get(s.unitId) || 0) + 1,
      );
    });

    const allUnits = await prisma.unit.findMany({
      where: { departmentId: deptId },
      select: { id: true, name: true },
    });

    const unitStats = allUnits
      .map((u) => {
        const held = unitSessionCount.get(u.id) || 0;
        const expected = weeksElapsed;
        const rate =
          expected > 0 ? ((held / expected) * 100).toFixed(1) : "0.0";
        return {
          unitId: u.id,
          unitName: u.name,
          sessionCount: held,
          rate,
          sessionsExpected: expected,
        };
      })
      .sort((a, b) => parseFloat(a.rate) - parseFloat(b.rate));

    // ============================================================
    // 5. INTERVENTION LIST (session-based, per program+year+sem)
    // ============================================================
    const unitYearMap = new Map<string, string>();
    const unitDetails = await prisma.unit.findMany({
      where: { departmentId: deptId },
      select: { id: true, studyYearId: true, semesterId: true, programId: true },
    });
    unitDetails.forEach((u) =>
      unitYearMap.set(u.id, `${u.programId}|${u.studyYearId}|${u.semesterId}`),
    );

    const sessionsByKey = new Map<string, { sessionId: string }[]>();
    allSessions.forEach((s) => {
      const key = unitYearMap.get(s.unitId);
      if (!key) return;
      const arr = sessionsByKey.get(key) || [];
      arr.push({ sessionId: s.id });
      sessionsByKey.set(key, arr);
    });

    const presentByStudent = new Map<string, Set<string>>();
    allSessions.forEach((s) => {
      s.records.forEach((r) => {
        if (r.status !== "PRESENT") return;
        const set = presentByStudent.get(r.studentId) || new Set<string>();
        set.add(s.id);
        presentByStudent.set(r.studentId, set);
      });
    });

    const lowAttendees = students
      .map((s) => {
        const key = `${s.programId}|${s.studyYearId}|${s.semesterId}`;
        const relevant = sessionsByKey.get(key) || [];
        const totalSessions = relevant.length;
        if (totalSessions === 0) return null;
        const attended = presentByStudent.get(s.id) || new Set<string>();
        const present = relevant.filter((r) =>
          attended.has(r.sessionId),
        ).length;
        const rate = ((present / totalSessions) * 100).toFixed(1);
        return {
          studentId: s.id,
          regNo: s.regNo,
          name: s.fullName,
          program: s.program?.name || "N/A",
          rate,
        };
      })
      .filter((s): s is NonNullable<typeof s> => s !== null)
      .filter((s) => parseFloat(s.rate) < 75)
      .sort((a, b) => parseFloat(a.rate) - parseFloat(b.rate));

    return {
      departmentRate,
      programStats,
      lecturerStats,
      unitStats,
      lowAttendees,
    };
  }

  // ============================================================
  // STUDENT REPORT — matrix of students × units with attendance %
  // ============================================================
  async getStudentReportMatrix(
    hodId: string,
    filters: {
      programId?: string;
      studyYearId?: string;
      semesterId?: string;
    },
  ) {
    const hod = await prisma.hod.findUnique({ where: { id: hodId } });
    if (!hod) throw new Error("HOD not found");
    const deptId = hod.departmentId;

    // ============================================================
    // SEMESTER RESOLUTION
    // ============================================================
    const activeYear = await prisma.academicYear.findFirst({
      where: { status: "ACTIVE", archived: false },
    });
    const currentSemester = await prisma.semester.findFirst({
      where: {
        universityId: hod.universityId,
        startDate: { lte: new Date() },
        endDate: { gte: new Date() },
      },
      orderBy: { startDate: "desc" },
    });
    const semesterStart = currentSemester?.startDate
      ? new Date(currentSemester.startDate)
      : activeYear?.startDate
        ? new Date(activeYear.startDate)
        : new Date();
    const semesterEnd = currentSemester?.endDate
      ? new Date(currentSemester.endDate)
      : activeYear?.endDate
        ? new Date(activeYear.endDate)
        : new Date();

    // ============================================================
    // 1. STUDENTS
    // ============================================================
    const studentWhere: any = { departmentId: deptId, archived: false };
    if (filters.programId) studentWhere.programId = filters.programId;
    if (filters.studyYearId) studentWhere.studyYearId = filters.studyYearId;
    if (filters.semesterId) studentWhere.semesterId = filters.semesterId;

    const students = await prisma.student.findMany({
      where: studentWhere,
      include: {
        program: true,
        studyYear: true,
        semester: true,
      },
      orderBy: { fullName: "asc" },
    });

    if (students.length === 0) {
      return { students: [], units: [] };
    }

    // ============================================================
    // 2. UNITS for these students
    // ============================================================
    const unitKeys = new Set<string>();
    students.forEach((s) => {
      unitKeys.add(`${s.programId}|${s.studyYearId}|${s.semesterId}`);
    });

    const unitWhere: any = {
      departmentId: deptId,
      OR: Array.from(unitKeys).map((key) => {
        const [programId, studyYearId, semesterId] = key.split("|");
        return { programId, studyYearId, semesterId };
      }),
    };

    const units = await prisma.unit.findMany({
      where: unitWhere,
      orderBy: { name: "asc" },
    });

    if (units.length === 0) {
      return {
        students: students.map((s) => ({
          id: s.id,
          fullName: s.fullName,
          regNo: s.regNo,
          programName: s.program?.name || "",
          studyYearName: s.studyYear?.name || "",
          semesterName: s.semester?.name || "",
          attendance: {},
          overall: 0,
        })),
        units: [],
      };
    }

    // ============================================================
    // 3. SESSIONS — semester-scoped, non-active
    // ============================================================
    const unitIds = units.map((u) => u.id);
    const sessions = await prisma.attendanceSession.findMany({
      where: {
        unitId: { in: unitIds },
        status: { not: "ACTIVE" },
        sessionDate: { gte: semesterStart, lte: semesterEnd },
      },
      select: { id: true, unitId: true },
    });

    const sessionsByUnit = new Map<string, string[]>();
    sessions.forEach((s) => {
      const arr = sessionsByUnit.get(s.unitId) || [];
      arr.push(s.id);
      sessionsByUnit.set(s.unitId, arr);
    });

    // ============================================================
    // 4. RECORDS — only for students + sessions in scope
    // ============================================================
    const sessionIds = sessions.map((s) => s.id);
    const studentIds = students.map((s) => s.id);

    const records = await prisma.attendanceRecord.findMany({
      where: {
        sessionId: { in: sessionIds },
        studentId: { in: studentIds },
        status: "PRESENT",
      },
      select: { sessionId: true, studentId: true },
    });

    const attendedByStudent = new Map<string, Set<string>>();
    records.forEach((r) => {
      const set = attendedByStudent.get(r.studentId) || new Set<string>();
      set.add(r.sessionId);
      attendedByStudent.set(r.studentId, set);
    });

    // ============================================================
    // 5. MATRIX
    // ============================================================
    const matrix = students.map((s) => {
      const attended = attendedByStudent.get(s.id) || new Set<string>();
      const attendance: Record<string, number> = {};
      let studentTotalAttended = 0;
      let studentTotalSessions = 0;

      units.forEach((u) => {
        if (
          u.programId !== s.programId ||
          u.studyYearId !== s.studyYearId ||
          u.semesterId !== s.semesterId
        ) {
          attendance[u.id] = -1;
          return;
        }

        const unitSessions = sessionsByUnit.get(u.id) || [];
        const totalSessions = unitSessions.length;
        const attendedCount = unitSessions.filter((sid) =>
          attended.has(sid),
        ).length;

        const pct =
          totalSessions > 0
            ? Math.round((attendedCount / totalSessions) * 100)
            : 0;

        attendance[u.id] = pct;
        studentTotalAttended += attendedCount;
        studentTotalSessions += totalSessions;
      });

      const overall =
        studentTotalSessions > 0
          ? Math.round((studentTotalAttended / studentTotalSessions) * 100)
          : 0;

      return {
        id: s.id,
        fullName: s.fullName,
        regNo: s.regNo,
        programName: s.program?.name || "",
        studyYearName: s.studyYear?.name || "",
        semesterName: s.semester?.name || "",
        attendance,
        overall,
      };
    });

    return {
      students: matrix,
      units: units.map((u) => ({ id: u.id, code: u.code, name: u.name })),
    };
  }

  // ============================================================
  // STUDENT ATTENDANCE GRID — dates × units with ✅ / ❌
  // ============================================================
   async getStudentAttendanceGrid(hodId: string, studentId: string) {
    const hod = await prisma.hod.findUnique({ where: { id: hodId } });
    if (!hod) throw new Error("HOD not found");

    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        program: true,
        studyYear: true,
        semester: true,
        department: { include: { faculty: true } },
        University: true,
      },
    });
    if (!student) throw new Error("Student not found");

    // ============================================================
    // SEMESTER RESOLUTION
    // ============================================================
    const activeYear = await prisma.academicYear.findFirst({
      where: {
        universityId: student.universityId,
        status: "ACTIVE",
        archived: false,
      },
    });
    const currentSemester = await prisma.semester.findFirst({
      where: {
        universityId: student.universityId,
        startDate: { lte: new Date() },
        endDate: { gte: new Date() },
      },
      orderBy: { startDate: "desc" },
    });
    const semesterStart = currentSemester?.startDate
      ? new Date(currentSemester.startDate)
      : activeYear?.startDate
        ? new Date(activeYear.startDate)
        : new Date();
    const semesterEnd = currentSemester?.endDate
      ? new Date(currentSemester.endDate)
      : activeYear?.endDate
        ? new Date(activeYear.endDate)
        : new Date();

    // ============================================================
    // UNITS for this student
    // ============================================================
    const units = await prisma.unit.findMany({
      where: {
        programId: student.programId,
        studyYearId: student.studyYearId,
        semesterId: student.semesterId,
        departmentId: student.departmentId,
      },
      orderBy: { code: "asc" },
    });

    if (units.length === 0) {
      return {
        student: {
          fullName: student.fullName,
          regNo: student.regNo,
          programName: student.program?.name || "",
          studyYearName: student.studyYear?.name || "",
          semesterName: student.semester?.name || "",
        },
        university: student.University,
        department: student.department,
        faculty: student.department?.faculty || null,
        academicYear: activeYear?.name || "",
        units: [],
        dates: [],
        grid: {},
        summary: { perUnit: [], totalPresent: 0, totalMissed: 0 },
      };
    }

    const unitIds = units.map((u) => u.id);

    // ============================================================
    // SESSIONS — semester-scoped, non-active, uses sessionDate
    // ============================================================
    const sessions = await prisma.attendanceSession.findMany({
      where: {
        unitId: { in: unitIds },
        status: { not: "ACTIVE" },
        sessionDate: { gte: semesterStart, lte: semesterEnd },
      },
      orderBy: { sessionDate: "asc" },
      select: { id: true, unitId: true, sessionDate: true },
    });

    const sessionIds = sessions.map((s) => s.id);
    const records = await prisma.attendanceRecord.findMany({
      where: {
        studentId,
        sessionId: { in: sessionIds },
      },
      select: { sessionId: true, status: true },
    });

    const statusBySession = new Map<string, string>();
    records.forEach((r) => {
      statusBySession.set(r.sessionId, r.status);
    });

    // ============================================================
    // GRID — keyed by sessionDate
    // ============================================================
    const datesSet = new Set<string>();
    sessions.forEach((s) => {
      const dateKey = new Date(s.sessionDate).toISOString().split("T")[0];
      datesSet.add(dateKey);
    });
    const dates = Array.from(datesSet).sort();

    const grid: Record<string, Record<string, string | null>> = {};
    dates.forEach((date) => {
      grid[date] = {};
      units.forEach((u) => {
        grid[date][u.id] = null;
      });
    });

    sessions.forEach((s) => {
      const dateKey = new Date(s.sessionDate).toISOString().split("T")[0];
      const status = statusBySession.get(s.id);
      grid[dateKey][s.unitId] = status === "PRESENT" ? "PRESENT" : "ABSENT";
    });

    // ============================================================
    // PER-UNIT SUMMARY
    // ============================================================
    const perUnit = units.map((u) => {
      const unitSessions = sessions.filter((s) => s.unitId === u.id);
      const present = unitSessions.filter(
        (s) => statusBySession.get(s.id) === "PRESENT",
      ).length;
      const missed = unitSessions.length - present;
      return {
        unitId: u.id,
        unitCode: u.code,
        unitName: u.name,
        present,
        missed,
        total: unitSessions.length,
      };
    });

    const totalPresent = perUnit.reduce((sum, u) => sum + u.present, 0);
    const totalMissed = perUnit.reduce((sum, u) => sum + u.missed, 0);

    return {
      student: {
        fullName: student.fullName,
        regNo: student.regNo,
        programName: student.program?.name || "",
        studyYearName: student.studyYear?.name || "",
        semesterName: student.semester?.name || "",
      },
      university: student.University,
      department: student.department,
      faculty: student.department?.faculty || null,
      academicYear: activeYear?.name || "",
      units: units.map((u) => ({ id: u.id, code: u.code, name: u.name })),
      dates,
      grid,
      summary: { perUnit, totalPresent, totalMissed },
    };
  }

  // --- Search ---
  async searchDepartment(hodId: string, query: string) {
    const hod = await prisma.hod.findUnique({ where: { id: hodId } });
    if (!hod) return { lecturers: [], students: [], units: [], programs: [] };
    const deptId = hod.departmentId;
    const q = query.toLowerCase();

    const [lecturers, students, units, programs] = await Promise.all([
      prisma.lecturer.findMany({
        where: {
          departmentId: deptId,
          OR: [
            { fullName: { contains: q, mode: "insensitive" } },
            { staffNumber: { contains: q, mode: "insensitive" } },
          ],
        },
        take: 5,
      }),
      prisma.student.findMany({
        where: {
          departmentId: deptId,
          OR: [
            { fullName: { contains: q, mode: "insensitive" } },
            { regNo: { contains: q, mode: "insensitive" } },
          ],
        },
        take: 5,
      }),
      prisma.unit.findMany({
        where: {
          departmentId: deptId,
          name: { contains: q, mode: "insensitive" },
        },
        take: 5,
      }),
      prisma.programme.findMany({
        where: {
          departmentId: deptId,
          name: { contains: q, mode: "insensitive" },
        },
        take: 5,
      }),
    ]);

    return {
      lecturers: lecturers.map((l) => ({
        type: "lecturer",
        id: l.id,
        title: l.fullName,
        subtitle: l.staffNumber,
      })),
      students: students.map((s) => ({
        type: "student",
        id: s.id,
        title: s.fullName,
        subtitle: s.regNo,
      })),
      units: units.map((u) => ({
        type: "unit",
        id: u.id,
        title: u.name,
        subtitle: u.code || "",
      })),
      programs: programs.map((p) => ({
        type: "program",
        id: p.id,
        title: p.name,
        subtitle: "Program",
      })),
    };
  }
}
