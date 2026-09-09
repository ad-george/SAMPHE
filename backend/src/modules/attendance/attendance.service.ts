import { PrismaClient } from '@prisma/client';
import { generateSessionToken, haversineDistance, generateBrowserFingerprint } from '../../utils/helpers';

const prisma = new PrismaClient();

export class AttendanceService {
  async createSession(lecturerId: string, data: any) {
    const token = generateSessionToken();
    return prisma.attendanceSession.create({
      data: {
        lecturerId,
        unitId: data.unitId,
        universityId: data.universityId,
        sessionToken: token,
        attendanceRadius: data.radius,
        lecturerLatitude: data.latitude,
        lecturerLongitude: data.longitude,
        lecturerGpsAccuracy: data.accuracy,
        attendanceDuration: data.duration,
        endTime: new Date(Date.now() + data.duration * 60000),
      },
    });
  }

  async submitAttendance(sessionToken: string, data: any, req: any) {
    const session = await prisma.attendanceSession.findUnique({
      where: { sessionToken },
      include: { unit: true },
    });

    if (!session) throw new Error('Invalid attendance session');
    if (session.status !== 'OPEN') throw new Error('Attendance session has expired or is closed');
    if (new Date() > session.endTime!) {
      await prisma.attendanceSession.update({
        where: { id: session.id },
        data: { status: 'EXPIRED' },
      });
      throw new Error('Attendance session has expired');
    }

    const student = await prisma.student.findFirst({
      where: {
        registrationNumber: data.registrationNumber,
        programmeId: session.unit.programmeId,
        studyYearId: session.unit.studyYearId,
        semesterId: session.unit.semesterId,
        status: 'ACTIVE',
      },
    });

    if (!student) throw new Error('Unknown registration number or student not in this cohort');

    const existing = await prisma.attendanceRecord.findUnique({
      where: { sessionId_studentId: { sessionId: session.id, studentId: student.id } },
    });
    if (existing) throw new Error('Attendance has already been submitted');

    const distance = haversineDistance(
      session.lecturerLatitude,
      session.lecturerLongitude,
      data.latitude,
      data.longitude
    );

    if (distance > session.attendanceRadius) {
      throw new Error(`You are outside the permitted attendance area (${Math.round(distance)}m away)`);
    }

    if (data.accuracy > 50) {
      throw new Error('GPS accuracy is insufficient. Please enable High Accuracy Location and try again.');
    }

    const fingerprint = generateBrowserFingerprint(req);

    const duplicateFingerprint = await prisma.attendanceRecord.findFirst({
      where: { sessionId: session.id, browserFingerprint: fingerprint },
    });
    if (duplicateFingerprint) {
      throw new Error('Multiple submissions from the same device are not allowed');
    }

    const record = await prisma.attendanceRecord.create({
      data: {
        sessionId: session.id,
        studentId: student.id,
        registrationNumber: student.registrationNumber,
        studentName: student.fullName,
        studentLatitude: data.latitude,
        studentLongitude: data.longitude,
        studentGpsAccuracy: data.accuracy,
        calculatedDistance: distance,
        browserFingerprint: fingerprint,
        browserInfo: req.headers['user-agent'] || '',
        deviceInfo: req.headers['user-agent'] || '',
        osInfo: req.headers['user-agent'] || '',
      },
    });

    return record;
  }

  async getLiveAttendance(sessionId: string) {
    return prisma.attendanceRecord.findMany({
      where: { sessionId },
      orderBy: { submissionTime: 'desc' },
    });
  }

  async getSessionByToken(token: string) {
    return prisma.attendanceSession.findUnique({
      where: { sessionToken: token },
      include: { unit: { include: { programme: true, studyYear: true, semester: true } }, lecturer: true },
    });
  }

  async getSessionById(id: string) {
    return prisma.attendanceSession.findUnique({
      where: { id },
      include: {
        unit: true,
        records: { include: { student: true } },
        lecturer: true,
      },
    });
  }

  async closeSession(sessionId: string, lecturerId: string) {
    const session = await prisma.attendanceSession.findFirst({
      where: { id: sessionId, lecturerId },
    });
    if (!session) throw new Error('Session not found');

    return prisma.attendanceSession.update({
      where: { id: sessionId },
      data: { status: 'CLOSED', endTime: new Date() },
    });
  }

  async getLecturerSessions(lecturerId: string) {
    return prisma.attendanceSession.findMany({
      where: { lecturerId },
      include: { unit: true, _count: { select: { records: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getDepartmentSessions(departmentId: string) {
    return prisma.attendanceSession.findMany({
      where: {
        lecturer: { departmentId },
      },
      include: { unit: true, lecturer: true, _count: { select: { records: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }
}