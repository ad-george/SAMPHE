import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class AnalyticsService {
  async getLecturerStats(lecturerId: string) {
    const sessions = await prisma.attendanceSession.findMany({
      where: { lecturerId },
      include: { records: true, unit: true },
    });

    const totalSessions = sessions.length;
    const totalStudents = sessions.reduce((sum: number, s: any) => sum + s.records.length, 0);
    const avgAttendance = totalSessions > 0 ? (totalStudents / totalSessions).toFixed(2) : '0';

    return { totalSessions, totalStudents, avgAttendance, sessions };
  }

  async getDepartmentStats(departmentId: string) {
    const lecturers = await prisma.lecturer.findMany({
      where: { departmentId },
      include: { sessions: { include: { records: true, unit: true } } },
    });

    const totalSessions = lecturers.reduce((sum: number, l: any) => sum + l.sessions.length, 0);
    const totalRecords = lecturers.reduce(
      (sum: number, l: any) => sum + l.sessions.reduce((s: number, ses: any) => s + ses.records.length, 0),
      0
    );

    return { totalLecturers: lecturers.length, totalSessions, totalRecords, lecturers };
  }
}