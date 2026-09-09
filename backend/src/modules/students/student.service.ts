import { PrismaClient } from "@prisma/client";
import ExcelJS from "exceljs";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export class StudentService {
  async importStudents(universityId: string, fileBuffer: Buffer) {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(fileBuffer as any);
    const worksheet = workbook.worksheets[0];

    const students: any[] = [];
    const errors: string[] = [];

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      const regNo = row.getCell(1).value?.toString().trim();
      const fullName = row.getCell(2).value?.toString().trim();
      const programmeName = row.getCell(3).value?.toString().trim();
      const studyYear = row.getCell(4).value?.toString().trim();
      const semester = row.getCell(5).value?.toString().trim();
      const admissionYear = row.getCell(6).value?.toString().trim();

      if (!regNo || !fullName) {
        errors.push(`Row ${rowNumber}: Missing required fields`);
        return;
      }

      students.push({
        regNo,
        fullName,
        programmeName,
        studyYear,
        semester,
        admissionYear,
      });
    });

    const created: any[] = [];
    for (const s of students) {
      try {
        const programme = await prisma.programme.findFirst({
          where: { name: s.programmeName, universityId },
          include: { department: true },
        });
        if (!programme) {
          errors.push(`Row with ${s.regNo}: Programme not found`);
          continue;
        }

        const studyYearRec = await prisma.studyYear.findFirst({
          where: { name: s.studyYear, universityId },
        });
        const semesterRec = await prisma.semester.findFirst({
          where: { name: s.semester, universityId },
        });

        if (!studyYearRec || !semesterRec) {
          errors.push(`Row with ${s.regNo}: Invalid study year or semester`);
          continue;
        }

        const hashedPassword = await bcrypt.hash(s.regNo, 10);

        const student = await prisma.student.upsert({
          where: { regNo: s.regNo },
          update: {
            fullName: s.fullName,
            programId: programme.id,
            studyYearId: studyYearRec.id,
            semesterId: semesterRec.id,
            admissionYear:
              s.admissionYear || new Date().getFullYear().toString(),
          },
          create: {
            regNo: s.regNo,
            fullName: s.fullName,
            programId: programme.id,
            studyYearId: studyYearRec.id,
            semesterId: semesterRec.id,
            admissionYear:
              s.admissionYear || new Date().getFullYear().toString(),
            universityId,
            departmentId: programme.departmentId || "",
            password: hashedPassword,
            archived: false, // ✅ Fixed: Removed 'status: "ACTIVE"' and used your schema's default unarchived state
          },
        });
        created.push(student);
      } catch (err: any) {
        errors.push(`Row with ${s.regNo}: ${err.message}`);
      }
    }

    return { created: created.length, errors, total: students.length };
  }

  async getStudentsByUniversity(universityId: string, filters: any = {}) {
    const where: any = { universityId };
    if (filters.programId) where.programId = filters.programId;
    if (filters.studyYearId) where.studyYearId = filters.studyYearId;
    if (filters.semesterId) where.semesterId = filters.semesterId;

    // ✅ Fixed: Changed status filter to look at the archived field instead
    if (filters.status) {
      where.archived = filters.status === "ARCHIVED";
    }

    if (filters.search) {
      where.OR = [
        { regNo: { contains: filters.search, mode: "insensitive" } },
        { fullName: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    return prisma.student.findMany({
      where,
      include: { program: true, studyYear: true, semester: true },
      orderBy: { fullName: "asc" },
    });
  }

  async searchStudent(regNo: string, unitId: string) {
    const unit = await prisma.unit.findUnique({
      where: { id: unitId },
      include: { program: true, studyYear: true, semester: true }, // ✅ Fixed: 'programme' changed to 'program'
    });
    if (!unit) throw new Error("Unit not found");

    const student = await prisma.student.findFirst({
      where: {
        regNo,
        programId: unit.programId, // ✅ Fixed: 'unit.programmeId' changed to 'unit.programId'
        studyYearId: unit.studyYearId,
        semesterId: unit.semesterId,
        archived: false, // ✅ Fixed: Removed 'status: "ACTIVE"' to match schema fields
      },
      include: { program: true, studyYear: true, semester: true },
    });

    if (!student)
      throw new Error("Student not found or not registered for this cohort");
    return student;
  }

  async getStudentById(studentId: string, universityId: string) {
    return prisma.student.findFirst({
      where: { id: studentId, universityId },
      include: { program: true, studyYear: true, semester: true },
    });
  }
}
