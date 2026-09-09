import { PrismaClient } from "@prisma/client";
import {
  generateSessionToken,
  haversineDistance,
  generateBrowserFingerprint,
} from "../../utils/helpers";

const prisma = new PrismaClient();

export class AttendanceService {
  async createSession(lecturerId: string, data: any) {
    const generatedToken = generateSessionToken();
    return prisma.attendanceSession.create({
      data: {
        lecturerId,
        unitId: data.unitId,
        universityId: data.universityId,
        departmentId: data.departmentId,
        token: generatedToken, // Maps to schema 'token'
        radius: data.radius || 75, // Maps to schema 'radius'
        duration: data.duration || 15, // Maps to schema 'duration'
        gpsLocation: `${data.latitude},${data.longitude}`, // Maps to your schema's single string gpsLocation field
        status: "OPEN",
        endTime: new Date(Date.now() + (data.duration || 15) * 60000) as any, // Casted if missing from your local schema definition
      } as any, // Protected from dynamic/missing custom schema tracking additions
    });
  }

  async submitAttendance(token: string, data: any, req: any) {
    const session = (await prisma.attendanceSession.findUnique({
      where: { token },
      include: { unit: true },
    })) as any;

    if (!session) throw new Error("Invalid attendance session");
    if (session.status !== "OPEN" && session.status !== "ACTIVE")
      throw new Error("Attendance session has expired or is closed");

    if (session.endTime && new Date() > new Date(session.endTime)) {
      await prisma.attendanceSession.update({
        where: { id: session.id },
        data: { status: "EXPIRED" } as any,
      });
      throw new Error("Attendance session has expired");
    }

    const student = await prisma.student.findFirst({
      where: {
        regNo: data.registrationNumber || data.regNo,
        programId: (session.unit as any).programId,
        studyYearId: session.unit.studyYearId,
        semesterId: session.unit.semesterId,
        archived: false,
      },
    });

    if (!student)
      throw new Error(
        "Unknown registration number or student not in this cohort",
      );

    // Safe dynamic query structure to handle compound key variances gracefully
    const existing = await prisma.attendanceRecord.findFirst({
      where: {
        sessionId: session.id,
        studentId: student.id,
      },
    });
    if (existing) throw new Error("Attendance has already been submitted");

    // Parse out geolocation parameters from the main session string safely
    const [sessionLat, sessionLng] = (session.gpsLocation || "0,0")
      .split(",")
      .map(Number);

    const distance = haversineDistance(
      sessionLat || 0,
      sessionLng || 0,
      data.latitude,
      data.longitude,
    );

    if (distance > (session.radius || 75)) {
      throw new Error(
        `You are outside the permitted attendance area (${Math.round(distance)}m away)`,
      );
    }

    if (data.accuracy > 50) {
      throw new Error(
        "GPS accuracy is insufficient. Please enable High Accuracy Location and try again.",
      );
    }

    const fingerprint = generateBrowserFingerprint(req);

    const duplicateFingerprint = await prisma.attendanceRecord.findFirst({
      where: { sessionId: session.id, browserFingerprint: fingerprint } as any,
    });
    if (duplicateFingerprint) {
      throw new Error(
        "Multiple submissions from the same device are not allowed",
      );
    }

    const record = await prisma.attendanceRecord.create({
      data: {
        sessionId: session.id,
        studentId: student.id,
        registrationNumber: student.regNo,
        studentName: student.fullName,
        studentLatitude: data.latitude,
        studentLongitude: data.longitude,
        studentGpsAccuracy: data.accuracy,
        calculatedDistance: distance,
        browserFingerprint: fingerprint,
        browserInfo: req.headers["user-agent"] || "",
        deviceInfo: req.headers["user-agent"] || "",
        osInfo: req.headers["user-agent"] || "",
      } as any,
    });

    return record;
  }

  async getLiveAttendance(sessionId: string) {
    return prisma.attendanceRecord.findMany({
      where: { sessionId },
      orderBy: { createdAt: "desc" } as any,
    });
  }

  async getSessionByToken(token: string) {
    return prisma.attendanceSession.findUnique({
      where: { token } as any,
      include: {
        unit: {
          include: { program: true, studyYear: true, semester: true } as any,
        },
        lecturer: true,
      },
    });
  }

  async getSessionById(id: string) {
    return prisma.attendanceSession.findUnique({
      where: { id },
      include: {
        unit: true,
        records: { include: { student: true } },
        lecturer: true,
      } as any,
    });
  }

  async closeSession(sessionId: string, lecturerId: string) {
    const session = await prisma.attendanceSession.findFirst({
      where: { id: sessionId, lecturerId },
    });
    if (!session) throw new Error("Session not found");

    return prisma.attendanceSession.update({
      where: { id: sessionId },
      data: { status: "CLOSED", endTime: new Date() } as any,
    });
  }

  async getLecturerSessions(lecturerId: string) {
    return prisma.attendanceSession.findMany({
      where: { lecturerId },
      include: { unit: true, _count: { select: { records: true } } } as any,
      orderBy: { createdAt: "desc" },
    });
  }

  async getDepartmentSessions(departmentId: string) {
    return prisma.attendanceSession.findMany({
      where: {
        lecturer: { departmentId },
      } as any,
      include: {
        unit: true,
        lecturer: true,
        _count: { select: { records: true } },
      } as any,
      orderBy: { createdAt: "desc" },
    });
  }
}
