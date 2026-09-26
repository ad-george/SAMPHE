import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

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
  async bulkImportStudents(hodId: string, students: any[]) {
    const hod = await prisma.hod.findUnique({
      where: { id: hodId },
      include: { university: true, department: true },
    });
    if (!hod) throw new Error("HOD not found");

    // Fetch all reference data once
    const [allPrograms, allYears, allSemesters] = await Promise.all([
      prisma.programme.findMany({ where: { universityId: hod.universityId } }),
      prisma.studyYear.findMany({ where: { universityId: hod.universityId } }),
      prisma.semester.findMany({ where: { universityId: hod.universityId } }),
    ]);

    console.log(
      "📚 Found years in DB:",
      allYears.map((y) => y.name),
    );
    console.log(
      "📚 Found semesters in DB:",
      allSemesters.map((s) => s.name),
    );
    console.log(
      "📚 Found programs in DB:",
      allPrograms.map((p) => p.name),
    );

    // Improved fuzzy matcher
    const findBest = (list: any[], search: string, key: string = "name") => {
      const s = search?.toLowerCase().trim() || "";
      if (!s) return null;

      console.log(
        `🔍 Searching for "${s}" in`,
        list.map((x) => x[key]),
      );

      // 1. Exact match
      let m = list.find((x) => x[key].toLowerCase() === s);
      if (m) {
        console.log(`✅ Exact match: ${m[key]}`);
        return m;
      }

      // 2. Includes match
      m = list.find((x) => x[key].toLowerCase().includes(s));
      if (m) {
        console.log(`✅ Includes match: ${m[key]}`);
        return m;
      }

      // 3. Search includes list item
      m = list.find((x) => s.includes(x[key].toLowerCase()));
      if (m) {
        console.log(`✅ Reverse includes match: ${m[key]}`);
        return m;
      }

      // 4. Word match
      const words = s.split(/\s+/).filter((w) => w.length > 2);
      m = list.find((x) => words.some((w) => x[key].toLowerCase().includes(w)));
      if (m) {
        console.log(`✅ Word match: ${m[key]}`);
        return m;
      }

      console.log(`❌ No match for "${s}"`);
      return null;
    };

    const results = {
      created: 0,
      skipped: 0,
      failed: 0,
      errors: [] as string[],
      importedStudents: [] as any[],
    };

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

        const program = findBest(allPrograms, row.program);

        // Convert studyYear to proper format
        console.log(`🔍 Raw studyYear: "${row.studyYear}"`);
        let yearSearch = String(row.studyYear).trim();
        // If it's just a number like "2", convert to "Year 2"
        if (/^\d+$/.test(yearSearch)) {
          yearSearch = `Year ${yearSearch}`;
          console.log(`✅ Converted to: "${yearSearch}"`);
        }
        console.log(
          `📅 Searching year: "${yearSearch}" (original: "${row.studyYear}")`,
        );

        let studyYear = findBest(allYears, yearSearch);

        // If still not found, try all possible patterns
        if (!studyYear) {
          const patterns = [
            `Year ${row.studyYear}`,
            `${row.studyYear}st Year`,
            `${row.studyYear}nd Year`,
            `${row.studyYear}rd Year`,
            `${row.studyYear}th Year`,
          ];
          for (const p of patterns) {
            studyYear = findBest(allYears, p);
            if (studyYear) break;
          }
        }

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
            `Row ${row.regNo}: ${missing} not found (program='${row.program}', year='${row.studyYear}', sem='${row.semester}')`,
          );
          continue;
        }

        const exists = await prisma.student.findFirst({
          where: { regNo: row.regNo.trim() },
        });
        if (exists) {
          results.skipped++;
          continue;
        }

        const defaultPassword = await bcrypt.hash(row.regNo.trim(), 10);

        const created = await prisma.student.create({
          data: {
            regNo: row.regNo.trim(),
            fullName: row.fullName.trim(),
            email: row.email.trim(),
            password: defaultPassword,
            programId: program.id,
            studyYearId: studyYear.id,
            semesterId: semester.id,
            universityId: hod.universityId,
            departmentId: hod.departmentId,
            archived: false,
            admissionYear: new Date().getFullYear().toString(),
          } as any,
          include: {
            program: true,
            studyYear: true,
            semester: true,
          },
        });

        // ✅ Find all units that match this student's program, studyYear, and semester
        const matchingUnits = await prisma.unit.findMany({
          where: {
            programId: program.id,
            studyYearId: studyYear.id,
            semesterId: semester.id,
            departmentId: hod.departmentId,
          },
          select: { id: true },
        });

        // ✅ Register the student to all matching units
        if (matchingUnits.length > 0) {
          await prisma.student.update({
            where: { id: created.id },
            data: {
              registeredUnits: {
                connect: matchingUnits.map((u) => ({ id: u.id })),
              },
            },
          });
        }

        results.created++;
        results.importedStudents.push({
          regNo: created.regNo,
          fullName: created.fullName,
          program: (created as any).program?.name,
          studyYear: (created as any).studyYear?.name,
          semester: (created as any).semester?.name,
        });

        results.created++;
        results.importedStudents.push({
          regNo: created.regNo,
          fullName: created.fullName,
          program: (created as any).program?.name,
          studyYear: (created as any).studyYear?.name,
          semester: (created as any).semester?.name,
        });
      } catch (err: any) {
        results.failed++;
        results.errors.push(`Row ${row.regNo || "?"}: ${err.message}`);
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

        const exists = await prisma.unit.findFirst({
          where: { code: row.code.trim(), departmentId: hod.departmentId },
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
  async getClassRecords(deptId: string, viewBy: string, filters: any) {
    const baseWhere: any = {};
    if (viewBy === "lecturer") baseWhere.lecturer = { departmentId: deptId };
    else if (viewBy === "unit") baseWhere.unit = { departmentId: deptId };
    else if (viewBy === "student") {
      return this.getStudentClassRecords(deptId, filters);
    }

    if (filters.unitId) baseWhere.unitId = filters.unitId;
    if (filters.programId)
      baseWhere.unit = { ...baseWhere.unit, programId: filters.programId };
    if (filters.dateFrom)
      baseWhere.sessionDate = { gte: new Date(filters.dateFrom) };
    if (filters.dateTo)
      baseWhere.sessionDate = {
        ...baseWhere.sessionDate,
        lte: new Date(filters.dateTo),
      };

    return prisma.attendanceSession.findMany({
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
            department: {
              include: {
                faculty: true,
              },
            },
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

    // ✅ Get active academic year (used for fallback only)
    const activeYear = await prisma.academicYear.findFirst({
      where: { status: "ACTIVE", archived: false },
    });

    // ✅ Get CURRENT SEMESTER from database (set by University Admin)
    const currentSemester = await prisma.semester.findFirst({
      where: {
        universityId: hod.universityId,
        startDate: { lte: new Date() },
        endDate: { gte: new Date() },
      },
      orderBy: { startDate: "desc" },
    });

    // ✅ Use semester dates, fallback to academic year
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

    const totalWeeksInSemester = Math.min(
      16,
      Math.ceil(
        (semesterEnd.getTime() - semesterStart.getTime()) /
          (1000 * 60 * 60 * 24 * 7),
      ),
    );

    let weeksElapsed = 1;
    if (currentSemester?.startDate || activeYear?.startDate) {
      const start = currentSemester?.startDate
        ? new Date(currentSemester.startDate)
        : new Date(activeYear!.startDate!);
      const now = new Date();
      const diffTime = now.getTime() - start.getTime();
      weeksElapsed = Math.max(
        1,
        Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 7)),
      );
    }

    const [
      programmeCount,
      lecturerCount,
      studentCount,
      unitCount,
      monthSessionsCount,
      allSessionsCount,
      recentSessions,
      allRecords,
      programs,
      units,
    ] = await Promise.all([
      prisma.programme.count({ where: { departmentId: deptId } }),
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
      prisma.attendanceSession.count({
        where: { lecturer: { departmentId: deptId } },
      }),
      prisma.attendanceSession.findMany({
        where: { lecturer: { departmentId: deptId } },
        include: { unit: true, lecturer: true, records: true },
        orderBy: { sessionDate: "desc" },
        take: 5,
      }),
      prisma.attendanceRecord.findMany({
        where: { session: { lecturer: { departmentId: deptId } } },
        select: { status: true, createdAt: true },
      }),
      prisma.programme.findMany({
        where: { departmentId: deptId },
        select: { id: true, name: true },
      }),
      prisma.unit.findMany({
        where: { departmentId: deptId },
        select: { id: true, programId: true },
      }),
    ]);

    const totalClassesExpected = units.length * totalWeeksInSemester;
    const totalAttended = allSessionsCount;
    const totalMissed = Math.max(0, totalClassesExpected - totalAttended);

    const monthlyTrend = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const start = new Date(d.getFullYear(), d.getMonth(), 1);
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
      const monthRecs = allRecords.filter(
        (r) => r.createdAt >= start && r.createdAt <= end,
      );
      const present = monthRecs.filter((r) => r.status === "PRESENT").length;
      monthlyTrend.push({
        month: d.toLocaleString("default", { month: "short" }),
        rate:
          monthRecs.length > 0
            ? ((present / monthRecs.length) * 100).toFixed(0)
            : 0,
      });
    }
    // Get all sessions for the department
    const allSessions = await prisma.attendanceSession.findMany({
      where: { lecturer: { departmentId: deptId } },
      include: { records: true },
    });

    // ✅ Attendance by Program = Sessions Held / Sessions Expected × 100
    // Sessions Expected = Units in Program × Total Weeks in Semester
    const programStats = programs.map((p) => {
      const programUnits = units.filter((u) => u.programId === p.id);
      const sessionsExpected = programUnits.length * totalWeeksInSemester;

      const programSessions = allSessions.filter((s) =>
        programUnits.some((u) => u.id === s.unitId),
      );
      const sessionsHeld = programSessions.length;

      const rate =
        sessionsExpected > 0
          ? ((sessionsHeld / sessionsExpected) * 100).toFixed(1)
          : "0.0";

      return {
        name: p.name,
        rate,
      };
    });

    // Calculate weekly trend
    const weeklyTrend = [];
    if (semesterStart) {
      const start = new Date(semesterStart);
      const end = semesterEnd ? new Date(semesterEnd) : new Date();
      const totalWeeks = Math.min(
        16,
        Math.ceil(
          (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 7),
        ),
      );
      const now = new Date();

      for (let i = 0; i < totalWeeks; i++) {
        const weekStart = new Date(
          start.getTime() + i * 7 * 24 * 60 * 60 * 1000,
        );
        const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);

        // If week hasn't started yet, show 0%
        if (weekStart > now) {
          weeklyTrend.push({ week: `Wk${i + 1}`, rate: 0 });
          continue;
        }

        // Get sessions in this week
        const weekSessions = allSessions.filter(
          (s: any) => s.createdAt >= weekStart && s.createdAt < weekEnd,
        );

        // Calculate total enrolled and total present
        let totalEnrolled = 0;
        let totalPresent = 0;
        weekSessions.forEach((s: any) => {
          totalEnrolled += s.totalStudents || 0;
          const present = s.records.filter(
            (r: any) => r.status === "PRESENT",
          ).length;
          totalPresent += present;
        });

        const rate =
          totalEnrolled > 0
            ? Math.round((totalPresent / totalEnrolled) * 100)
            : 0;
        weeklyTrend.push({ week: `Wk${i + 1}`, rate });
      }
    }

    const recentClasses = recentSessions.map((c) => ({
      date: c.sessionDate,
      unit: c.unit?.name,
      lecturer: c.lecturer?.fullName,
      rate:
        c.records.length > 0
          ? Math.round(
              (c.records.filter((r: any) => r.status === "PRESENT").length /
                c.records.length) *
                100,
            )
          : 0,
      present: c.records.filter((r: any) => r.status === "PRESENT").length,
      total: c.records.length,
    }));

    const students = await prisma.student.findMany({
      where: { departmentId: deptId },
      include: { records: true, program: true },
    });
    const lowAttendees = students
      .map((s) => {
        const present = s.records.filter((r) => r.status === "PRESENT").length;
        const rate =
          s.records.length > 0 ? (present / s.records.length) * 100 : 0;
        return {
          name: s.fullName,
          regNo: s.regNo,
          rate: rate.toFixed(0),
          program: s.program?.name,
        };
      })
      .filter((s) => parseFloat(s.rate) < 75)
      .sort((a, b) => parseFloat(a.rate) - parseFloat(b.rate))
      .slice(0, 6);

    // ✅ Avg Attendance = Sessions Held / Sessions Expected × 100
    const avgAttendance =
      totalClassesExpected > 0
        ? ((totalAttended / totalClassesExpected) * 100).toFixed(1)
        : "0.0";

    // ✅ Avg Student Attendance = Average of per-session (Present / Expected) × 100
    let sessionRateSum = 0;
    let sessionCountWithData = 0;

    allSessions.forEach((s: any) => {
      const expected = s.totalStudents || 0;
      const present = s.records.filter(
        (r: any) => r.status === "PRESENT",
      ).length;
      if (expected > 0) {
        sessionRateSum += (present / expected) * 100;
        sessionCountWithData++;
      }
    });

    const avgStudentAttendance =
      sessionCountWithData > 0
        ? (sessionRateSum / sessionCountWithData).toFixed(1)
        : "0.0";

    return {
      stats: {
        programs: programmeCount,
        lecturers: lecturerCount,
        students: studentCount,
        units: unitCount,
        monthClasses: monthSessionsCount,
      },
      monthlyTrend,
      programStats,
      weeklyTrend,
      recentClasses,
      lowAttendees,
      summary: {
        totalClasses: totalClassesExpected,
        totalAttended: totalAttended,
        totalMissed: totalMissed,
        avgAttendance: avgAttendance,
        avgStudentAttendance: avgStudentAttendance,
      },
    };
  }

  // --- Analytics ---
  // --- Analytics ---
  async getAnalytics(hodId: string) {
    const hod = await prisma.hod.findUnique({ where: { id: hodId } });
    if (!hod) throw new Error("HOD not found");
    const deptId = hod.departmentId;

    // ✅ Get current semester from database
    const currentSemester = await prisma.semester.findFirst({
      where: {
        universityId: hod.universityId,
        startDate: { lte: new Date() },
        endDate: { gte: new Date() },
      },
      orderBy: { startDate: "desc" },
    });

    const activeYear = await prisma.academicYear.findFirst({
      where: { status: "ACTIVE", archived: false },
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

    const totalWeeksInSemester = Math.min(
      16,
      Math.ceil(
        (semesterEnd.getTime() - semesterStart.getTime()) /
          (1000 * 60 * 60 * 24 * 7),
      ),
    );

    // ✅ Fetch all units, lecturers, programs, and sessions for the department
    const [units, lecturers, programs, allSessions, students] =
      await Promise.all([
        prisma.unit.findMany({
          where: { departmentId: deptId },
          select: { id: true, programId: true },
        }),
        prisma.lecturer.findMany({
          where: { departmentId: deptId },
          select: { id: true, fullName: true },
        }),
        prisma.programme.findMany({
          where: { departmentId: deptId },
          select: { id: true, name: true },
        }),
        prisma.attendanceSession.findMany({
          where: { lecturer: { departmentId: deptId } },
          select: { id: true, unitId: true, lecturerId: true },
        }),
        prisma.student.findMany({
          where: { departmentId: deptId },
          include: { records: true, program: true },
        }),
      ]);

    // ============================================================
    // 1. DEPARTMENT ATTENDANCE RATE = Sessions Held / Expected × 100
    // ============================================================
    const totalSessionsExpected = units.length * totalWeeksInSemester;
    const totalSessionsHeld = allSessions.length;
    const departmentRate =
      totalSessionsExpected > 0
        ? ((totalSessionsHeld / totalSessionsExpected) * 100).toFixed(1)
        : "0.0";

    // ============================================================
    // 2. PROGRAM COMPARISON = Sessions Held / Expected × 100 per program
    // ============================================================
    const programStats = programs.map((p) => {
      const programUnits = units.filter((u) => u.programId === p.id);
      const sessionsExpected = programUnits.length * totalWeeksInSemester;
      const programSessions = allSessions.filter((s) =>
        programUnits.some((u) => u.id === s.unitId),
      );
      const sessionsHeld = programSessions.length;

      const rate =
        sessionsExpected > 0
          ? ((sessionsHeld / sessionsExpected) * 100).toFixed(1)
          : "0.0";

      return {
        programId: p.id,
        programName: p.name,
        studentCount: students.filter((s) => s.program?.name === p.name).length,
        rate,
        sessionsHeld,
        sessionsExpected,
      };
    });

    // ============================================================
    // 3. LECTURER PERFORMANCE = Sessions Held / Expected × 100
    // ============================================================
    const lecturerStats = lecturers
      .map((l) => {
        // Get units assigned to this lecturer
        const lecturerAssignments = allSessions.filter(
          (s) => s.lecturerId === l.id,
        );
        // Sum expected sessions across lecturer's distinct units
        const lecturerUnitIds = [
          ...new Set(lecturerAssignments.map((s) => s.unitId)),
        ];
        const sessionsExpected = lecturerUnitIds.length * totalWeeksInSemester;
        const sessionsHeld = lecturerAssignments.length;

        const rate =
          sessionsExpected > 0
            ? ((sessionsHeld / sessionsExpected) * 100).toFixed(1)
            : "0.0";

        return {
          lecturerId: l.id,
          lecturerName: l.fullName,
          sessionCount: sessionsHeld,
          rate,
        };
      })
      .sort((a, b) => parseFloat(b.rate) - parseFloat(a.rate));

    // ============================================================
    // 4. WORST PERFORMING UNITS = Sessions Held / Expected × 100
    // ============================================================
    const unitStats = units.map((u) => {
      const unitSessions = allSessions.filter((s) => s.unitId === u.id);
      const sessionsExpected = totalWeeksInSemester;
      const sessionsHeld = unitSessions.length;

      const rate =
        sessionsExpected > 0
          ? ((sessionsHeld / sessionsExpected) * 100).toFixed(1)
          : "0.0";

      // Fetch unit name
      return {
        unitId: u.id,
        unitName: "", // will be filled below
        sessionCount: sessionsHeld,
        rate,
        sessionsExpected,
      };
    });

    // Fill in unit names
    const unitIds = unitStats.map((u) => u.unitId);
    const unitNames = await prisma.unit.findMany({
      where: { id: { in: unitIds } },
      select: { id: true, name: true },
    });
    const unitNameMap = new Map(unitNames.map((u) => [u.id, u.name]));
    unitStats.forEach((u) => {
      u.unitName = unitNameMap.get(u.unitId) || "Unknown";
    });
    unitStats.sort((a, b) => parseFloat(a.rate) - parseFloat(b.rate));

    // ============================================================
    // 5. INTERVENTION LIST = Students with (Present / Total) < 75%
    // ============================================================
    const lowAttendees = students
      .map((s) => {
        const present = s.records.filter((r) => r.status === "PRESENT").length;
        const rate =
          s.records.length > 0 ? (present / s.records.length) * 100 : 0;
        return {
          studentId: s.id,
          regNo: s.regNo,
          name: s.fullName,
          program: s.program?.name || "N/A",
          rate: rate.toFixed(1),
        };
      })
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

    // 1. Get students matching the filters
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

    // 2. Collect all unique units the students belong to
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

    // 3. Get all sessions for these units
    const unitIds = units.map((u) => u.id);
    const sessions = await prisma.attendanceSession.findMany({
      where: {
        unitId: { in: unitIds },
        status: { not: "ACTIVE" },
      },
      select: { id: true, unitId: true },
    });

    // Map: unitId → array of sessionIds
    const sessionsByUnit = new Map<string, string[]>();
    sessions.forEach((s) => {
      const arr = sessionsByUnit.get(s.unitId) || [];
      arr.push(s.id);
      sessionsByUnit.set(s.unitId, arr);
    });

    // 4. Get all attendance records for these sessions & students
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

    // Build: studentId → Set of sessionIds attended
    const attendedByStudent = new Map<string, Set<string>>();
    records.forEach((r) => {
      const set = attendedByStudent.get(r.studentId) || new Set<string>();
      set.add(r.sessionId);
      attendedByStudent.set(r.studentId, set);
    });

    // 5. Build the matrix
    const matrix = students.map((s) => {
      const attended = attendedByStudent.get(s.id) || new Set<string>();

      // Per unit: % of sessions attended
      const attendance: Record<string, number> = {};
      let studentTotalAttended = 0;
      let studentTotalSessions = 0;

      units.forEach((u) => {
        // Only count if the unit matches this student's program/year/semester
        if (
          u.programId !== s.programId ||
          u.studyYearId !== s.studyYearId ||
          u.semesterId !== s.semesterId
        ) {
          attendance[u.id] = -1; // -1 = not applicable
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
      units: units.map((u) => ({
        id: u.id,
        code: u.code,
        name: u.name,
      })),
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
        department: {
          include: { faculty: true },
        },
        University: true,
      },
    });
    if (!student) throw new Error("Student not found");

    // Get the academic year (active one)
    const activeYear = await prisma.academicYear.findFirst({
      where: {
        universityId: student.universityId,
        status: "ACTIVE",
        archived: false,
      },
    });

    // Units for this student's program + year + semester
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
        summary: {
          perUnit: [],
          totalPresent: 0,
          totalMissed: 0,
        },
      };
    }

    const unitIds = units.map((u) => u.id);

    // Get all sessions for these units (non-active)
    const sessions = await prisma.attendanceSession.findMany({
      where: {
        unitId: { in: unitIds },
        status: { not: "ACTIVE" },
      },
      orderBy: { createdAt: "asc" },
      select: { id: true, unitId: true, createdAt: true },
    });

    // Get student's records in these sessions
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

    // Build the grid: for each session (unique date + unit), mark ✅ / ❌
    const datesSet = new Set<string>();
    sessions.forEach((s) => {
      const dateKey = new Date(s.createdAt).toISOString().split("T")[0];
      datesSet.add(dateKey);
    });

    const dates = Array.from(datesSet).sort();

    // grid[date][unitId] = "PRESENT" | "ABSENT" | null
    const grid: Record<string, Record<string, string | null>> = {};

    dates.forEach((date) => {
      grid[date] = {};
      units.forEach((u) => {
        grid[date][u.id] = null;
      });
    });

    sessions.forEach((s) => {
      const dateKey = new Date(s.createdAt).toISOString().split("T")[0];
      const status = statusBySession.get(s.id);
      grid[dateKey][s.unitId] = status === "PRESENT" ? "PRESENT" : "ABSENT";
    });

    // Per-unit summary
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
