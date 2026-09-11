import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import {
  haversineDistance,
  generateBrowserFingerprint,
} from "../../utils/helpers";

const prisma = new PrismaClient();

export class LecturerService {
  // --- Profile ---
  async getMe(lecturerId: string) {
    const lecturer = await prisma.lecturer.findUnique({
      where: { id: lecturerId },
      include: {
        department: true,
        university: true,
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

    if (!lecturer) return null;

    return {
      ...lecturer,
      units: lecturer.assignments.map((a) => a.unit),
    };
  }

  async updateMe(lecturerId: string, data: any) {
    if (data.password) data.password = await bcrypt.hash(data.password, 10);
    return prisma.lecturer.update({ where: { id: lecturerId }, data });
  }

  // --- Dashboard ---
  async getDashboardStats(lecturerId: string) {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // Get lecturer with assignments
    const lecturer = await prisma.lecturer.findUnique({
      where: { id: lecturerId },
      include: {
        assignments: { include: { unit: { include: { students: true } } } },
      },
    });
    if (!lecturer) throw new Error("Lecturer not found");

    const totalUnits = lecturer.assignments.length;

    // Get all sessions with totalStudents
    const allSessions = await prisma.attendanceSession.findMany({
      where: { lecturerId },
      orderBy: { createdAt: "desc" },
      include: {
        records: true,
        unit: {
          include: {
            semester: true,
            program: true,
            studyYear: true,
          },
        },
      },
    });

    // Today's sessions
    const todaySessions = allSessions.filter(
      (s) => s.createdAt >= todayStart && s.createdAt <= todayEnd,
    );

    // Active session
    // Active session (with expiry check)
    const activeSession = await this.getActiveSession(lecturerId);

    // Calculate avg attendance using totalStudents
    let totalEnrolled = 0;
    let totalPresent = 0;
    allSessions.forEach((s) => {
      totalEnrolled += s.totalStudents || 0;
      totalPresent += s.records.filter((r) => r.status === "PRESENT").length;
    });
    const avgAttendance =
      totalEnrolled > 0
        ? ((totalPresent / totalEnrolled) * 100).toFixed(1)
        : "0.0";

    // Recent sessions with correct totals
    const recentSessions = allSessions
      .filter((s) => s.status !== "ACTIVE")
      .slice(0, 5)
      .map((s) => {
        const present = s.records.filter((r) => r.status === "PRESENT").length;
        const total = s.totalStudents || 0;
        return {
          id: s.id,
          date: s.createdAt,
          unit: s.unit?.name || "Unknown",
          program: s.unit?.program?.name || "",
          studyYear: s.unit?.studyYear?.name || "",
          present,
          total,
          rate: total > 0 ? Math.round((present / total) * 100) : 0,
        };
      });

    return {
      todayClasses: todaySessions.length,
      activeSession: activeSession
        ? {
            unitName: activeSession.unit?.name,
            unitCode: activeSession.unit?.code,
            remainingMin: Math.max(
              0,
              activeSession.duration -
                Math.floor(
                  (Date.now() - new Date(activeSession.createdAt).getTime()) /
                    60000,
                ),
            ),
          }
        : null,
      totalUnits,
      avgAttendance,
      sessionsConducted: allSessions.length,
      recentSessions,
    };
  }

  // --- My Units ---
  async getMyUnits(lecturerId: string) {
    const lecturer = await prisma.lecturer.findUnique({
      where: { id: lecturerId },
      include: {
        assignments: {
          include: {
            unit: {
              include: {
                program: true,
                studyYear: true,
                semester: true,
                students: true,
                sessions: { include: { records: true } },
              },
            },
          },
        },
      },
    });

    if (!lecturer) return [];

    return lecturer.assignments.map((a) => {
      const unit = a.unit;
      const totalStudents = unit.students?.length || 0;
      const sessions = unit.sessions || [];

      // Calculate total present across all sessions for this unit
      let totalPresent = 0;
      let totalEnrolledAcrossSessions = 0;
      sessions.forEach((s: any) => {
        totalPresent += s.records.filter(
          (r: any) => r.status === "PRESENT",
        ).length;
        totalEnrolledAcrossSessions += s.totalStudents || totalStudents;
      });

      const avg =
        totalEnrolledAcrossSessions > 0
          ? ((totalPresent / totalEnrolledAcrossSessions) * 100).toFixed(1)
          : "0.0";

      return {
        id: unit.id,
        name: unit.name,
        code: unit.code,
        program: unit.program?.name,
        studyYear: unit.studyYear?.name,
        semester: unit.semester?.name,
        totalStudents,
        sessionsConducted: sessions.length,
        avgAttendance: avg,
      };
    });
  }

  // --- Create Session ---
  async createSession(lecturerId: string, data: any) {
    const token = crypto.randomUUID();
    const lecturer = await prisma.lecturer.findUnique({
      where: { id: lecturerId },
      select: { universityId: true, departmentId: true },
    });
    if (!lecturer) throw new Error("Lecturer not found");

    const totalStudents = await prisma.student.count({
      where: {
        registeredUnits: {
          some: { id: data.unitId },
        },
        archived: false,
      },
    });

    return prisma.attendanceSession.create({
      data: {
        lecturerId,
        unitId: data.unitId,
        universityId: lecturer.universityId,
        departmentId: lecturer.departmentId,
        duration: data.duration || 15,
        radius: data.radius || 75,
        gpsLocation: data.gpsLocation,
        token,
        status: "ACTIVE",
        totalStudents,
      },
      include: { unit: true, lecturer: true },
    });
  }

  // --- Search ---
  async searchLecturerScope(lecturerId: string, query: string) {
    const q = query.toLowerCase();
    const lecturer = await prisma.lecturer.findUnique({
      where: { id: lecturerId },
      include: { units: { include: { program: true, students: true } } },
    });
    if (!lecturer)
      return { students: [], units: [], programs: [], records: [] };

    const unitIds = lecturer.units.map((u: any) => u.id);
    const programIds = [
      ...new Set(lecturer.units.map((u: any) => u.programId)),
    ];

    const [students, units, programs, records] = await Promise.all([
      prisma.student.findMany({
        where: {
          programId: { in: programIds },
          OR: [
            { regNo: { contains: q, mode: "insensitive" } },
            { fullName: { contains: q, mode: "insensitive" } },
          ],
        },
        take: 5,
        include: { program: true, studyYear: true },
      }),
      prisma.unit.findMany({
        where: {
          id: { in: unitIds },
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { code: { contains: q, mode: "insensitive" } },
          ],
        },
        take: 5,
        include: { program: true },
      }),
      prisma.programme.findMany({
        where: {
          id: { in: programIds },
          name: { contains: q, mode: "insensitive" },
        },
        take: 5,
      }),
      prisma.attendanceSession.findMany({
        where: {
          lecturerId,
          unit: { name: { contains: q, mode: "insensitive" } },
        },
        take: 5,
        include: { unit: true },
      }),
    ]);

    return {
      students: students.map((s: any) => ({
        type: "student",
        id: s.id,
        title: s.fullName,
        subtitle: s.regNo,
      })),
      units: units.map((u: any) => ({
        type: "unit",
        id: u.id,
        title: u.name,
        subtitle: u.code,
      })),
      programs: programs.map((p: any) => ({
        type: "program",
        id: p.id,
        title: p.name,
        subtitle: "Program",
      })),
      records: records.map((r: any) => ({
        type: "record",
        id: r.id,
        title: r.unit?.name,
        subtitle: new Date(r.createdAt).toLocaleDateString(),
      })),
    };
  }

  // --- Public Check-In ---
  async getSessionByToken(token: string) {
    const session = await prisma.attendanceSession.findUnique({
      where: { token },
      include: {
        unit: {
          include: {
            program: true,
            studyYear: true,
            semester: true,
            department: {
              include: {
                faculty: true,
              },
            },
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
        records: { include: { student: true } },
      },
    });

    // ❌ Session doesn't exist → return null
    if (!session) {
      return null;
    }

    // ❌ Session not active → return null
    if (session.status !== "ACTIVE") {
      return null;
    }

    // ❌ Session expired → return null
    const elapsed = Math.floor(
      (Date.now() - new Date(session.createdAt).getTime()) / 60000,
    );
    if (elapsed > session.duration) {
      return null;
    }

    return session;
  }

  async markAttendance(token: string, data: any, req?: any) {
    console.log("🔍 markAttendance called with:", { token, regNo: data.regNo });

    // ============================================================
    // 1. VALIDATE SESSION - IMMEDIATE 404
    // ============================================================

    const session = await prisma.attendanceSession.findUnique({
      where: { token },
      include: { unit: true },
    });

    // ❌ Session doesn't exist → 404
    if (!session) {
      throw new Error("ATTENDANCE_LINK_NOT_FOUND");
    }

    // ❌ Session not active → 404
    if (session.status !== "ACTIVE") {
      throw new Error("ATTENDANCE_LINK_NOT_FOUND");
    }

    // ❌ Session expired → 404
    const elapsed = Math.floor(
      (Date.now() - new Date(session.createdAt).getTime()) / 60000,
    );

    if (elapsed > session.duration) {
      throw new Error("ATTENDANCE_LINK_NOT_FOUND");
    }

    // ============================================================
    // 2. VALIDATE STUDENT
    // ============================================================

    if (!data.regNo || data.regNo.trim() === "") {
      throw new Error("Registration number is required");
    }

    const student = await prisma.student.findFirst({
      where: {
        regNo: {
          equals: data.regNo.trim(),
          mode: "insensitive",
        },
      },
    });

    if (!student) {
      throw new Error("Student not found");
    }

    // Check if student is registered for this unit
    const isRegistered = await prisma.student.findFirst({
      where: {
        id: student.id,
        registeredUnits: {
          some: {
            id: session.unitId,
          },
        },
      },
    });

    if (!isRegistered) {
      throw new Error("Student is not registered for this unit");
    }

    // ============================================================
    // 3. CHECK DUPLICATE - Same Student
    // ============================================================

    const existingStudent = await prisma.attendanceRecord.findFirst({
      where: { sessionId: session.id, studentId: student.id },
    });

    if (existingStudent) {
      throw new Error("You have already checked in");
    }

    // ============================================================
    // 4. GENERATE BROWSER FINGERPRINT
    // ============================================================

    let fingerprint: string | null = null;
    if (req) {
      fingerprint = generateBrowserFingerprint(req);
    }

    // ============================================================
    // 5. CHECK DEVICE - Layer 2 & 3
    // ============================================================

    if (fingerprint) {
      // ✅ Layer 2 & 3: Check if THIS device was used by ANY student
      const existingDevice = await prisma.attendanceRecord.findFirst({
        where: {
          sessionId: session.id,
          browserFingerprint: fingerprint,
        },
      });

      if (existingDevice) {
        // Check if it was the SAME student
        if (existingDevice.studentId === student.id) {
          throw new Error("You have already checked in from another device");
        } else {
          throw new Error("This device has already been used for this session");
        }
      }
    }

    // ============================================================
    // 6. CHECK GOOGLE ACCOUNT - Layer 4
    // ============================================================

    if (data.googleAccountId) {
      const existingAccount = await prisma.attendanceRecord.findFirst({
        where: {
          sessionId: session.id,
          googleAccountId: data.googleAccountId,
        },
      });

      if (existingAccount) {
        throw new Error(
          "This Google account has already been used for this session",
        );
      }
    }
    // ============================================================
    // 7. VALIDATE GPS
    // ============================================================

    if (!data.studentLat || !data.studentLng) {
      throw new Error(
        "GPS location is required. Please enable location services.",
      );
    }

    if (!session.gpsLocation) {
      throw new Error("Lecturer's GPS location is not set for this session");
    }

    // ✅ Reject weak GPS signal (tolerance scales with radius)
    const accuracyTolerance = Math.max(200, session.radius);
    if (data.studentAccuracy && data.studentAccuracy > accuracyTolerance) {
      throw new Error(
        `GPS accuracy too low (±${Math.round(data.studentAccuracy)}m). Move to an open area and try again.`,
      );
    }

    const [sLat, sLng] = session.gpsLocation.split(",").map(Number);
    const distance = haversineDistance(
      sLat,
      sLng,
      data.studentLat,
      data.studentLng,
    );

    // ✅ Enforce distance — must be within session radius
    if (distance > session.radius) {
      throw new Error(
        `You are ${Math.round(distance)}m away from the class. You must be within ${session.radius}m to mark attendance.`,
      );
    }

    const status = "PRESENT";

    // ============================================================
    // 9. CREATE AUDIT LOG
    // ============================================================

    try {
      await prisma.auditLog.create({
        data: {
          userType: "STUDENT",
          userId: student.id,
          activity: "ATTENDANCE_CHECK_IN",
          description: `Student ${student.regNo} checked in for ${session.unit?.name}`,
          ipAddress: req?.ip || null,
          device: req?.headers?.["user-agent"] || null,
          browser: req?.headers?.["user-agent"]?.split(" ")[0] || null,
          universityId: student.universityId,
          timestamp: new Date(),
        },
      });
    } catch (err) {
      console.error("Failed to create audit log:", err);
    }

    // ============================================================
    // 10. CREATE ATTENDANCE RECORD
    // ============================================================

    const record = await prisma.attendanceRecord.create({
      data: {
        sessionId: session.id,
        studentId: student.id,
        status,
        distance: Math.round(distance),
        browserFingerprint: fingerprint,
        googleAccountId: data.googleAccountId || null,
      },
    });

    console.log("🔍 Attendance record created:", record.id);

    return {
      ...record,
      distance: Math.round(distance),
      isWithinRadius: true,
      status: "PRESENT",
      message: "Attendance recorded successfully!",
    };
  }

  // --- Archive ---
  async archiveSession(lecturerId: string, sessionId: string) {
    const session = await prisma.attendanceSession.findFirst({
      where: { id: sessionId, lecturerId },
    });
    if (!session) throw new Error("Session not found");
    return prisma.attendanceSession.update({
      where: { id: sessionId },
      data: { archived: true },
    });
  }

  async unarchiveSession(lecturerId: string, sessionId: string) {
    const session = await prisma.attendanceSession.findFirst({
      where: { id: sessionId, lecturerId },
    });
    if (!session) throw new Error("Session not found");
    return prisma.attendanceSession.update({
      where: { id: sessionId },
      data: { archived: false },
    });
  }

  async getArchived(lecturerId: string) {
    return prisma.attendanceSession.findMany({
      where: { lecturerId, archived: true, status: { not: "ACTIVE" } },
      include: { unit: true, records: true },
      orderBy: { createdAt: "desc" },
    });
  }

  async getSession(sessionId: string) {
    const session = await prisma.attendanceSession.findUnique({
      where: { id: sessionId },
      include: {
        unit: true,
        records: { include: { student: { include: { program: true } } } },
      },
    });

    // ❌ Session doesn't exist → return null
    if (!session) {
      return null;
    }

    // ❌ Session is not ACTIVE → return null
    if (session.status !== "ACTIVE") {
      return null;
    }

    return session;
  }

  async getActiveSession(lecturerId: string) {
    return prisma.attendanceSession.findFirst({
      where: { lecturerId, status: "ACTIVE" },
      include: { unit: true, records: { include: { student: true } } },
    });
  }

  async endSession(sessionId: string) {
    return prisma.attendanceSession.update({
      where: { id: sessionId },
      data: { status: "COMPLETED" },
    });
  }

  async getMyStudents(lecturerId: string, programId?: string) {
    const lecturer = await prisma.lecturer.findUnique({
      where: { id: lecturerId },
      include: {
        assignments: {
          include: {
            unit: true,
          },
        },
      },
    });
    if (!lecturer) return [];

    const unitIds = lecturer.assignments.map((a) => a.unitId);

    const students = await prisma.student.findMany({
      where: {
        registeredUnits: {
          some: {
            id: { in: unitIds },
          },
        },
        archived: false,
      },
      include: {
        program: true,
        studyYear: true,
        semester: true,
        registeredUnits: true,
      },
      orderBy: { fullName: "asc" },
    });

    if (programId) {
      return students.filter((s) => s.programId === programId);
    }

    return students;
  }

  // --- Student Detailed Attendance (period + per-unit) ---
  async getStudentDetail(lecturerId: string, studentId: string, filters: any) {
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: { program: true, studyYear: true, semester: true },
    });
    if (!student) throw new Error("Student not found");

    const where: any = {
      lecturerId,
      records: { some: { studentId } },
      status: { not: "ACTIVE" },
    };

    if (filters.period === "month") {
      const d = new Date();
      d.setMonth(d.getMonth() - 1);
      where.createdAt = { gte: d };
    } else if (filters.period === "semester") {
      const d = new Date();
      d.setMonth(d.getMonth() - 4);
      where.createdAt = { gte: d };
    } else if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) where.createdAt.gte = new Date(filters.dateFrom);
      if (filters.dateTo) where.createdAt.lte = new Date(filters.dateTo);
    }
    if (filters.unitId && filters.unitId !== "all")
      where.unitId = filters.unitId;

    const sessions = await prisma.attendanceSession.findMany({
      where,
      include: { unit: true, records: { where: { studentId } } },
      orderBy: { createdAt: "desc" },
    });

    const totalExpected = sessions.length;
    const totalPresent = sessions.filter(
      (s: any) => s.records[0]?.status === "PRESENT",
    ).length;
    const totalMissed = totalExpected - totalPresent;
    const rate =
      totalExpected > 0
        ? ((totalPresent / totalExpected) * 100).toFixed(1)
        : "0.0";

    const unitMap = new Map();
    sessions.forEach((s: any) => {
      const existing = unitMap.get(s.unitId) || {
        unit: s.unit,
        expected: 0,
        present: 0,
        missed: 0,
        sessions: [],
      };
      existing.expected++;
      if (s.records[0]?.status === "PRESENT") existing.present++;
      else existing.missed++;
      existing.sessions.push({
        id: s.id,
        date: s.createdAt,
        status: s.records[0]?.status,
        unitCode: s.unit?.code,
        unitName: s.unit?.name,
      });
      unitMap.set(s.unitId, existing);
    });

    return {
      student,
      summary: { totalExpected, totalPresent, totalMissed, rate },
      overallSessions: sessions.map((s: any) => ({
        id: s.id,
        date: s.createdAt,
        unitCode: s.unit?.code,
        unitName: s.unit?.name,
        status: s.records[0]?.status,
      })),
      byUnit: Array.from(unitMap.values()),
    };
  }

  // --- Delete Session ---
  async deleteSession(lecturerId: string, sessionId: string) {
    const session = await prisma.attendanceSession.findFirst({
      where: { id: sessionId, lecturerId },
    });
    if (!session) throw new Error("Session not found");
    await prisma.attendanceRecord.deleteMany({ where: { sessionId } });
    return prisma.attendanceSession.delete({ where: { id: sessionId } });
  }

  // --- History ---
  async getHistory(lecturerId: string, filters: any) {
    const where: any = { lecturerId, status: { not: "ACTIVE" } };
    if (filters.unitId) where.unitId = filters.unitId;
    if (filters.dateFrom) where.createdAt = { gte: new Date(filters.dateFrom) };
    if (filters.dateTo)
      where.createdAt = { ...where.createdAt, lte: new Date(filters.dateTo) };

    return prisma.attendanceSession.findMany({
      where,
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
      orderBy: { createdAt: "desc" },
    });
  }

  // --- Student Search ---
  async searchStudent(lecturerId: string, query: string) {
    const q = query.toLowerCase();
    // Students in lecturer's units
    const lecturer = await prisma.lecturer.findUnique({
      where: { id: lecturerId },
      include: {
        units: {
          include: {
            students: {
              include: {
                program: true,
                studyYear: true,
                semester: true,
                records: { include: { session: true } },
              },
            },
          },
        },
      },
    });
    if (!lecturer) return [];
    const allStudents = lecturer.units.flatMap((u: any) => u.students);
    const unique = Array.from(
      new Map(allStudents.map((s: any) => [s.id, s])).values(),
    );
    return unique
      .filter(
        (s: any) =>
          s.regNo?.toLowerCase().includes(q) ||
          s.fullName?.toLowerCase().includes(q),
      )
      .slice(0, 10);
  }

  async getStudentTracking(studentId: string, lecturerId: string) {
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        program: true,
        studyYear: true,
        semester: true,
        records: { include: { session: { include: { unit: true } } } },
      },
    });
    if (!student) throw new Error("Student not found");
    // Filter to only this lecturer's sessions
    const relevant = student.records.filter(
      (r: any) => r.session.lecturerId === lecturerId,
    );
    const attended = relevant.filter((r: any) => r.status === "PRESENT").length;
    const missed = relevant.filter((r: any) => r.status === "ABSENT").length;
    const rate =
      relevant.length > 0
        ? ((attended / relevant.length) * 100).toFixed(1)
        : "0.0";
    return {
      student,
      totalClasses: relevant.length,
      attended,
      missed,
      rate,
      records: relevant,
    };
  }

  // --- Analytics ---
  async getAnalytics(lecturerId: string) {
    // Get lecturer first to get universityId
    const lecturer = await prisma.lecturer.findUnique({
      where: { id: lecturerId },
      select: { universityId: true },
    });
    if (!lecturer) throw new Error("Lecturer not found");

    // ✅ Get current semester from database (set by University Admin)
    const currentSemester = await prisma.semester.findFirst({
      where: {
        universityId: lecturer.universityId,
        startDate: { lte: new Date() },
        endDate: { gte: new Date() },
      },
      orderBy: { startDate: "desc" },
    });

    // Get all sessions
    const sessions = await prisma.attendanceSession.findMany({
      where: { lecturerId },
      include: {
        unit: {
          include: {
            students: true,
            semester: true,
            studyYear: true,
            program: true,
          },
        },
        records: true,
      },
      orderBy: { createdAt: "asc" },
    });

    if (sessions.length === 0) {
      return {
        weekly: [],
        monthly: [],
        byUnit: [],
        avgRate: "0.0",
        best: null,
        worst: null,
      };
    }

    // ✅ Use current semester start/end, fallback to first session
    const semesterStart =
      currentSemester?.startDate || sessions[0]?.createdAt || new Date();
    const semesterEnd = currentSemester?.endDate || new Date();
    const now = new Date();

    // ✅ Calculate total weeks in semester (max 16)
    const totalWeeks = Math.min(
      16,
      Math.ceil(
        (new Date(semesterEnd).getTime() - new Date(semesterStart).getTime()) /
          (1000 * 60 * 60 * 24 * 7),
      ),
    );

    const weeks: any[] = [];

    // ✅ Loop through ALL weeks of the semester (not just up to now)
    for (let i = 0; i < totalWeeks; i++) {
      const weekStart = new Date(
        new Date(semesterStart).getTime() + i * 7 * 24 * 60 * 60 * 1000,
      );
      const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);

      // ✅ If week hasn't started yet, show 0%
      if (weekStart > now) {
        weeks.push({ week: `Wk ${i + 1}`, rate: 0 });
        continue;
      }

      // Get sessions in this week
      const weekSessions = sessions.filter((s: any) => {
        const date = new Date(s.createdAt);
        return date >= weekStart && date < weekEnd;
      });

      let totalPresent = 0;
      let totalEnrolled = 0;
      weekSessions.forEach((s: any) => {
        totalPresent += s.records.filter(
          (r: any) => r.status === "PRESENT",
        ).length;
        totalEnrolled += s.totalStudents || 0;
      });

      weeks.push({
        week: `Wk ${i + 1}`,
        rate:
          totalEnrolled > 0
            ? Math.min(100, Math.round((totalPresent / totalEnrolled) * 100))
            : 0,
      });
    }

    // ... rest of byUnit calculation using totalStudents
    const unitMap = new Map();
    sessions.forEach((s: any) => {
      const present = s.records.filter(
        (r: any) => r.status === "PRESENT",
      ).length;
      const total = s.totalStudents || 0;
      const existing = unitMap.get(s.unitId) || {
        name: s.unit?.name || "Unknown",
        present: 0,
        total: 0,
      };
      existing.present += present;
      existing.total += total;
      unitMap.set(s.unitId, existing);
    });

    const byUnit = Array.from(unitMap.entries()).map(([_, v]: [any, any]) => ({
      name: v.name,
      rate: v.total > 0 ? ((v.present / v.total) * 100).toFixed(1) : 0,
    }));

    // Calculate overall
    let totalPresent = 0;
    let totalEnrolled = 0;
    sessions.forEach((s: any) => {
      totalPresent += s.records.filter(
        (r: any) => r.status === "PRESENT",
      ).length;
      totalEnrolled += s.totalStudents || 0;
    });
    const avgRate =
      totalEnrolled > 0
        ? ((totalPresent / totalEnrolled) * 100).toFixed(1)
        : "0.0";

    const best =
      byUnit.length > 0
        ? byUnit.reduce((a: any, b: any) =>
            parseFloat(a.rate) > parseFloat(b.rate) ? a : b,
          )
        : null;
    const worst =
      byUnit.length > 0
        ? byUnit.reduce((a: any, b: any) =>
            parseFloat(a.rate) < parseFloat(b.rate) ? a : b,
          )
        : null;

    // ✅ Attendance by Program (grouped by Program + Year + Semester)
    const programMap = new Map();

    sessions.forEach((s: any) => {
      const programName = s.unit?.program?.name || "Unknown";
      const studyYear = s.unit?.studyYear?.name || "";
      const semester = s.unit?.semester?.name || "";

      // Convert "Year 2" → "Y2", "Semester 1" → "S1"
      const yearNum = studyYear.match(/\d+/)?.[0] || "";
      const semNum = semester.match(/\d+/)?.[0] || "";
      const yearSem = yearNum && semNum ? ` Y${yearNum}S${semNum}` : "";

      const key = `${programName}${yearSem}`;

      const present = s.records.filter(
        (r: any) => r.status === "PRESENT",
      ).length;
      const enrolled = s.totalStudents || 0;

      const existing = programMap.get(key) || {
        name: key,
        present: 0,
        enrolled: 0,
      };
      existing.present += present;
      existing.enrolled += enrolled;
      programMap.set(key, existing);
    });

    const byProgram = Array.from(programMap.values()).map((p: any) => ({
      name: p.name,
      rate:
        p.enrolled > 0 ? ((p.present / p.enrolled) * 100).toFixed(1) : "0.0",
    }));

    return {
      weekly: weeks,
      monthly: [],
      byUnit,
      byProgram,
      avgRate,
      best,
      worst,
    };
  }

  // --- Sessions Analytics ---
  async getSessionsAnalytics(lecturerId: string) {
    // Get lecturer's university
    const lecturer = await prisma.lecturer.findUnique({
      where: { id: lecturerId },
      select: { universityId: true },
    });
    if (!lecturer) throw new Error("Lecturer not found");

    // ✅ Get current semester from database
    const currentSemester = await prisma.semester.findFirst({
      where: {
        universityId: lecturer.universityId,
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

    // Get all sessions with full unit details
    const sessions = await prisma.attendanceSession.findMany({
      where: { lecturerId },
      include: {
        unit: {
          include: {
            program: true,
            studyYear: true,
            semester: true,
          },
        },
        records: true,
      },
      orderBy: { createdAt: "asc" },
    });

    if (sessions.length === 0) {
      return {
        weekly: [],
        byUnit: [],
        byProgram: [],
        avgRate: "0.0",
        best: null,
        worst: null,
        totalUnits: 0,
      };
    }

    // ============================================================
    // WEEKLY TREND = Sessions Held / Expected × 100
    // ============================================================
    const totalUnits = new Set(sessions.map((s) => s.unitId)).size;
    const sessionsExpectedPerWeek = totalUnits; // Each unit expected once per week

    const now = new Date();
    const weeks: any[] = [];

    const totalWeeks = Math.min(
      16,
      Math.ceil(
        (new Date(semesterEnd).getTime() - new Date(semesterStart).getTime()) /
          (1000 * 60 * 60 * 24 * 7),
      ),
    );

    for (let i = 0; i < totalWeeks; i++) {
      const weekStart = new Date(
        new Date(semesterStart).getTime() + i * 7 * 24 * 60 * 60 * 1000,
      );
      const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);

      if (weekStart > now) {
        weeks.push({ week: `Wk ${i + 1}`, rate: 0 });
        continue;
      }

      const weekSessions = sessions.filter((s) => {
        const date = new Date(s.createdAt);
        return date >= weekStart && date < weekEnd;
      });

      const held = weekSessions.length;
      const rate =
        sessionsExpectedPerWeek > 0
          ? Math.min(100, Math.round((held / sessionsExpectedPerWeek) * 100))
          : 0;

      weeks.push({ week: `Wk ${i + 1}`, rate });
    }

    // ============================================================
    // BY UNIT = Sessions Held / Expected × 100
    // ============================================================
    const unitMap = new Map();
    sessions.forEach((s) => {
      const existing = unitMap.get(s.unitId) || {
        name: s.unit?.name || "Unknown",
        held: 0,
      };
      existing.held += 1;
      unitMap.set(s.unitId, existing);
    });

    const byUnit = Array.from(unitMap.values()).map((u: any) => ({
      name: u.name,
      rate:
        totalWeeksInSemester > 0
          ? Math.min(
              100,
              ((u.held / totalWeeksInSemester) * 100).toFixed(1) as any,
            )
          : 0,
    }));

    // ============================================================
    // BY PROGRAM = Sessions Held / Expected × 100
    // ============================================================
    const programMap = new Map();
    sessions.forEach((s) => {
      const programName = s.unit?.program?.name || "Unknown";
      const studyYear = s.unit?.studyYear?.name || "";
      const semester = s.unit?.semester?.name || "";

      const yearNum = studyYear.match(/\d+/)?.[0] || "";
      const semNum = semester.match(/\d+/)?.[0] || "";
      const yearSem = yearNum && semNum ? ` Y${yearNum}S${semNum}` : "";
      const key = `${programName}${yearSem}`;

      const existing = programMap.get(key) || {
        name: key,
        held: 0,
        units: new Set(),
      };
      existing.held += 1;
      existing.units.add(s.unitId);
      programMap.set(key, existing);
    });

    const byProgram = Array.from(programMap.values()).map((p: any) => {
      const expected = p.units.size * totalWeeksInSemester;
      return {
        name: p.name,
        rate:
          expected > 0
            ? Math.min(100, ((p.held / expected) * 100).toFixed(1) as any)
            : 0,
      };
    });

    // ============================================================
    // OVERALL + BEST + WORST
    // ============================================================
    const totalHeld = sessions.length;
    const totalExpected = totalUnits * totalWeeksInSemester;
    const avgRate =
      totalExpected > 0
        ? Math.min(100, (totalHeld / totalExpected) * 100).toFixed(1)
        : "0.0";

    const best =
      byUnit.length > 0
        ? byUnit.reduce((a: any, b: any) =>
            parseFloat(a.rate) > parseFloat(b.rate) ? a : b,
          )
        : null;
    const worst =
      byUnit.length > 0
        ? byUnit.reduce((a: any, b: any) =>
            parseFloat(a.rate) < parseFloat(b.rate) ? a : b,
          )
        : null;

    return {
      weekly: weeks,
      byUnit,
      byProgram,
      avgRate,
      best,
      worst,
      totalUnits,
    };
  }

  // --- Export Attendance Report ---
  async exportAttendanceReport(
    lecturerId: string,
    sessionId: string,
    format: "pdf" | "excel",
  ) {
    const session = await prisma.attendanceSession.findFirst({
      where: {
        id: sessionId,
        lecturerId,
      },
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
            student: true,
          },
        },
      },
    });

    if (!session) throw new Error("Session not found");

    const total = session.records?.length || 0;
    const present =
      session.records?.filter((r: any) => r.status === "PRESENT").length || 0;
    const rate = total > 0 ? Math.round((present / total) * 100) : 0;

    // Return data for the frontend to handle PDF/Excel generation
    return {
      session,
      summary: {
        total,
        present,
        absent: total - present,
        rate,
      },
    };
  }
}
