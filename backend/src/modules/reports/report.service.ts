import { PrismaClient } from "@prisma/client";
import PDFDocument from "pdfkit";
import ExcelJS from "exceljs";

const prisma = new PrismaClient();

export class ReportService {
  async getReport(sessionId: string) {
    const session = await prisma.attendanceSession.findUnique({
      where: { id: sessionId },
      include: {
        unit: {
          include: {
            program: true,
            studyYear: true,
            semester: true,
            department: {
              include: { faculty: true },
            },
          },
        },
        lecturer: { include: { department: true } },
        records: { include: { student: true } },
        university: true,
      },
    });

    if (!session) throw new Error("Session not found");

    const allStudents = await prisma.student.findMany({
      where: {
        programId: session.unit.programId,
        studyYearId: session.unit.studyYearId,
        semesterId: session.unit.semesterId,
        archived: false,
      },
    });

    const presentSet = new Set(session.records.map((r: any) => r.studentId));
    const reportData = allStudents.map((s: any) => ({
      ...s,
      status: presentSet.has(s.id) ? "PRESENT" : "ABSENT",
      submissionTime:
        session.records.find((r: any) => r.studentId === s.id)?.createdAt ||
        null,
    }));

    const total = allStudents.length;
    const present = session.records.length;
    const percentage =
      total > 0 ? ((present / total) * 100).toFixed(2) : "0.00";

    return {
      session,
      students: reportData,
      stats: { total, present, absent: total - present, percentage },
    };
  }

  async generatePDF(sessionId: string) {
    const { session, students, stats } = await this.getReport(sessionId);
    const doc = new PDFDocument({ margin: 50 });
    const chunks: Buffer[] = [];

    return new Promise<Buffer>((resolve, reject) => {
      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      const uni = session.university;
      doc.fontSize(18).text(uni.name, 50, 50);
      doc
        .fontSize(10)
        .text(`${uni.address || ""} | ${uni.email || ""} | ${uni.phone || ""}`);
      doc.moveDown();

      doc.fontSize(14).text(`Attendance Report`, { underline: true });
      doc.fontSize(10);
      doc.text(
        `Faculty: ${(session.unit.department as any).faculty?.name || "N/A"}`,
      );
      doc.text(`Department: ${session.unit.department.name}`);
      doc.text(`Programme: ${session.unit.program.name}`);
      doc.text(`Unit: ${session.unit.code} - ${session.unit.name}`);
      doc.text(`Lecturer: ${session.lecturer.fullName}`);
      doc.text(`Date: ${session.sessionDate.toDateString()}`);
      doc.text(`Duration: ${(session as any).duration} minutes`);
      doc.moveDown();

      doc.text(
        `Total: ${stats.total} | Present: ${stats.present} | Absent: ${stats.absent} | Rate: ${stats.percentage}%`,
      );
      doc.moveDown();

      doc.fontSize(10);
      let y = doc.y;
      doc.text("Reg No", 50, y);
      doc.text("Name", 150, y);
      doc.text("Status", 400, y);
      doc.text("Time", 450, y);
      doc.moveDown(0.5);

      students.forEach((s: any) => {
        y = doc.y;
        if (y > 700) {
          doc.addPage();
          y = 50;
        }
        doc.text(s.regNo, 50, y); // Changed registrationNumber to regNo
        doc.text(s.fullName, 150, y);
        doc.text(s.status, 400, y);
        doc.text(
          s.submissionTime
            ? new Date(s.submissionTime).toLocaleTimeString()
            : "-",
          450,
          y,
        );
        doc.moveDown(0.5);
      });

      doc.end();
    });
  }

  async generateExcel(sessionId: string) {
    const { session, students, stats } = await this.getReport(sessionId);
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Attendance");

    worksheet.mergeCells("A1", "F1");
    worksheet.getCell("A1").value =
      `${session.university.name} - Attendance Report`;
    worksheet.getCell("A1").font = { bold: true, size: 16 };

    worksheet.getCell("A3").value =
      `Unit: ${session.unit.code} - ${session.unit.name}`;
    worksheet.getCell("A4").value = `Lecturer: ${session.lecturer.fullName}`;
    worksheet.getCell("A5").value =
      `Date: ${session.sessionDate.toDateString()}`;

    worksheet.addRow([]);
    worksheet.addRow(["Reg No", "Student Name", "Status", "Submission Time"]);
    const headerRow = worksheet.lastRow!;
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFCCCCCC" },
    };

    students.forEach((s: any) => {
      worksheet.addRow([
        s.regNo, // Changed registrationNumber to regNo
        s.fullName,
        s.status,
        s.submissionTime ? new Date(s.submissionTime).toLocaleString() : "-",
      ]);
    });

    worksheet.addRow([]);
    worksheet.addRow(["Statistics", "", "", ""]);
    worksheet.addRow(["Total Students", stats.total, "", ""]);
    worksheet.addRow(["Present", stats.present, "", ""]);
    worksheet.addRow(["Absent", stats.absent, "", ""]);
    worksheet.addRow(["Percentage", `${stats.percentage}%`, "", ""]);

    return workbook.xlsx.writeBuffer();
  }
}
