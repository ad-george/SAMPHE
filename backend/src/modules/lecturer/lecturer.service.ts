import { PrismaClient } from "@prisma/client";
import { getSemesterWeekBuckets } from "../../utils/helpers";
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
    const lecturer = await prisma.lecturer.findUnique({
      where: { id: lecturerId },
      include: {
        university: true,
        assignments: { select: { unitId: true } },
      },
    });
    if (!lecturer) throw new Error("Lecturer not found");

    const assignedUnitIds = lecturer.assignments.map((a) => a.unitId);

    // ============================================================
    // SEMESTER RESOLUTION
    // ============================================================
    const activeYear = await prisma.academicYear.findFirst({
      where: { status: "ACTIVE", archived: false },
    });
    const currentSemester = await prisma.semester.findFirst({
      where: {
        universityId: lecturer.universityId,
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
    // FETCH SESSIONS (assigned units, semester-scoped, non-ACTIVE)
    // ============================================================
    const allSessions = await prisma.attendanceSession.findMany({
      where: {
        lecturerId,
        unitId: { in: assignedUnitIds },
        status: { not: "ACTIVE" },
        sessionDate: { gte: semesterStart, lte: semesterEnd },
      },
      orderBy: { sessionDate: "desc" },
      include: {
        records: { select: { status: true } },
        unit: {
          include: {
            program: true,
            studyYear: true,
            semester: true,
          },
        },
      },
    });

    // Today's sessions (based on sessionDate)
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);
    const todaySessions = allSessions.filter((s) => {
      const d = new Date(s.sessionDate);
      return d >= todayStart && d <= todayEnd;
    });

    // Active session (unchanged behavior, still real-time)
    const activeSession = await this.getActiveSession(lecturerId);

    // Avg attendance = PRESENT / totalStudents across semester
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

    // Recent sessions (5 most recent, semester-scoped)
    const recentSessions = allSessions.slice(0, 5).map((s) => {
      const present = s.records.filter((r) => r.status === "PRESENT").length;
      const total = s.totalStudents || 0;
      return {
        id: s.id,
        date: s.sessionDate,
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
      totalUnits: assignedUnitIds.length,
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
        university: true,
        assignments: {
          include: {
            unit: {
              include: {
                program: true,
                studyYear: true,
                semester: true,
                students: { select: { id: true } },
              },
            },
          },
        },
      },
    });
    if (!lecturer) return [];

    const activeYear = await prisma.academicYear.findFirst({
      where: { status: "ACTIVE", archived: false },
    });
    const currentSemester = await prisma.semester.findFirst({
      where: {
        universityId: lecturer.universityId,
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

    const unitIds = lecturer.assignments.map((a) => a.unitId);
    if (unitIds.length === 0) return [];

    const sessions = await prisma.attendanceSession.findMany({
      where: {
        unitId: { in: unitIds },
        status: { not: "ACTIVE" },
        sessionDate: { gte: semesterStart, lte: semesterEnd },
      },
      select: {
        unitId: true,
        totalStudents: true,
        records: { select: { status: true } },
      },
    });

    const unitAgg = new Map<
      string,
      { sessions: number; present: number; expected: number }
    >();
    sessions.forEach((s) => {
      const agg = unitAgg.get(s.unitId) || {
        sessions: 0,
        present: 0,
        expected: 0,
      };
      agg.sessions += 1;
      agg.present += s.records.filter((r) => r.status === "PRESENT").length;
      agg.expected += s.totalStudents || 0;
      unitAgg.set(s.unitId, agg);
    });

    return lecturer.assignments.map((a) => {
      const unit = a.unit;
      const agg = unitAgg.get(unit.id) || {
        sessions: 0,
        present: 0,
        expected: 0,
      };
      const avg =
        agg.expected > 0
          ? ((agg.present / agg.expected) * 100).toFixed(1)
          : "0.0";
      return {
        id: unit.id,
        name: unit.name,
        code: unit.code,
        program: unit.program?.name,
        studyYear: unit.studyYear?.name,
        semester: unit.semester?.name,
        totalStudents: unit.students?.length || 0,
        sessionsConducted: agg.sessions,
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
    const lecturer = await prisma.lecturer.findUnique({
      where: { id: lecturerId },
      select: {
        universityId: true,
        assignments: {
          include: {
            unit: {
              select: {
                id: true,
                name: true,
                programId: true,
                studyYearId: true,
                program: { select: { name: true } },
                studyYear: { select: { name: true } },
              },
            },
          },
        },
      },
    });
    if (!lecturer) throw new Error("Lecturer not found");

    const assignedUnits = lecturer.assignments.map((a) => a.unit);
    const assignedUnitIds = assignedUnits.map((u) => u.id);

    // ============================================================
    // SEMESTER RESOLUTION
    // ============================================================
    const activeYear = await prisma.academicYear.findFirst({
      where: { status: "ACTIVE", archived: false },
    });
    const currentSemester = await prisma.semester.findFirst({
      where: {
        universityId: lecturer.universityId,
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

    // ============================================================
    // SESSIONS for his assigned units (semester-scoped)
    // ============================================================
    const sessions = await prisma.attendanceSession.findMany({
      where: {
        lecturerId,
        unitId: { in: assignedUnitIds },
        status: { not: "ACTIVE" },
        sessionDate: { gte: semesterStart, lte: semesterEnd },
      },
      select: {
        id: true,
        unitId: true,
        sessionDate: true,
        totalStudents: true,
        records: { select: { studentId: true, status: true } },
      },
    });

    // ============================================================
    // WEEKLY TREND
    // ============================================================
    const weekly = weekBuckets.map((bucket) => {
      const weekSessions = sessions.filter((s) => {
        const d = new Date(s.sessionDate);
        return d >= bucket.start && d <= bucket.end;
      });
      let present = 0;
      let expected = 0;
      weekSessions.forEach((s) => {
        present += s.records.filter((r) => r.status === "PRESENT").length;
        expected += s.totalStudents || 0;
      });
      const rate =
        expected > 0 ? Math.round((present / expected) * 100) : 0;
      return { week: bucket.label, rate };
    });

    // ============================================================
    // BY UNIT — includes ALL assigned units (even 0 sessions)
    // ============================================================
    const unitAgg = new Map<
      string,
      { name: string; present: number; expected: number }
    >();
    assignedUnits.forEach((u) => {
      unitAgg.set(u.id, { name: u.name, present: 0, expected: 0 });
    });
    sessions.forEach((s) => {
      const agg = unitAgg.get(s.unitId);
      if (!agg) return;
      agg.present += s.records.filter((r) => r.status === "PRESENT").length;
      agg.expected += s.totalStudents || 0;
    });

    const byUnit = assignedUnits.map((u) => {
      const agg = unitAgg.get(u.id)!;
      return {
        id: u.id,
        name: u.name,
        rate:
          agg.expected > 0
            ? ((agg.present / agg.expected) * 100).toFixed(1)
            : "0.0",
      };
    });

    // ============================================================
    // BY PROGRAM (program + year) — includes ALL assigned units
    // ============================================================
    const programAgg = new Map<
      string,
      { name: string; present: number; expected: number }
    >();
    assignedUnits.forEach((u) => {
      const key = `${u.programId}|${u.studyYearId}`;
      if (!programAgg.has(key)) {
        programAgg.set(key, {
          name: `${u.program?.name || "Unknown"} ${u.studyYear?.name || ""}`.trim(),
          present: 0,
          expected: 0,
        });
      }
    });
    sessions.forEach((s) => {
      const unit = assignedUnits.find((u) => u.id === s.unitId);
      if (!unit) return;
      const key = `${unit.programId}|${unit.studyYearId}`;
      const agg = programAgg.get(key);
      if (!agg) return;
      agg.present += s.records.filter((r) => r.status === "PRESENT").length;
      agg.expected += s.totalStudents || 0;
    });

    const byProgram = Array.from(programAgg.values())
      .map((p) => ({
        name: p.name,
        rate:
          p.expected > 0
            ? ((p.present / p.expected) * 100).toFixed(1)
            : "0.0",
      }))
      .sort((a, b) => parseFloat(b.rate) - parseFloat(a.rate));

    // ============================================================
    // OVERALL (avgRate)
    // ============================================================
    let totalPresent = 0;
    let totalExpected = 0;
    sessions.forEach((s) => {
      totalPresent += s.records.filter((r) => r.status === "PRESENT").length;
      totalExpected += s.totalStudents || 0;
    });
    const avgRate =
      totalExpected > 0
        ? ((totalPresent / totalExpected) * 100).toFixed(1)
        : "0.0";

    // ============================================================
    // BEST / WORST (from byUnit, full list)
    // ============================================================
    const best =
      byUnit.length > 0
        ? byUnit.reduce((a, b) =>
            parseFloat(a.rate) > parseFloat(b.rate) ? a : b,
          )
        : null;
    const worst =
      byUnit.length > 0
        ? byUnit.reduce((a, b) =>
            parseFloat(a.rate) < parseFloat(b.rate) ? a : b,
          )
        : null;

    // ============================================================
    // INTERVENTION LIST — per-student, <75%, units he teaches
    // ============================================================
    // Get students registered in his units
    const students = await prisma.student.findMany({
      where: {
        archived: false,
        registeredUnits: { some: { id: { in: assignedUnitIds } } },
      },
      select: {
        id: true,
        fullName: true,
        regNo: true,
        program: { select: { name: true } },
      },
    });

    // For each student: sessions in units they're registered for AND lecturer taught
    // Group sessions by unitId
    const sessionsByUnit = new Map<string, typeof sessions>();
    sessions.forEach((s) => {
      const arr = sessionsByUnit.get(s.unitId) || [];
      arr.push(s);
      sessionsByUnit.set(s.unitId, arr);
    });

    // Get each student's registered units
    const studentUnits = await prisma.student.findMany({
      where: { id: { in: students.map((s) => s.id) } },
      select: { id: true, registeredUnits: { select: { id: true } } },
    });
    const studentUnitsMap = new Map(
      studentUnits.map((s) => [s.id, s.registeredUnits.map((u) => u.id)]),
    );

    const presentByStudent = new Map<string, Set<string>>();
    sessions.forEach((s) => {
      s.records.forEach((r) => {
        if (r.status !== "PRESENT") return;
        const set = presentByStudent.get(r.studentId) || new Set<string>();
        set.add(s.id);
        presentByStudent.set(r.studentId, set);
      });
    });

    const lowAttendees = students
      .map((s) => {
        const unitIds = studentUnitsMap.get(s.id) || [];
        const relevantSessions = unitIds.flatMap(
          (uid) => sessionsByUnit.get(uid) || [],
        );
        const totalSessions = relevantSessions.length;
        if (totalSessions === 0) return null;
        const attended = presentByStudent.get(s.id) || new Set<string>();
        const present = relevantSessions.filter((sess) =>
          attended.has(sess.id),
        ).length;
        const rate = ((present / totalSessions) * 100).toFixed(1);
        return {
          studentId: s.id,
          name: s.fullName,
          regNo: s.regNo,
          program: s.program?.name || "N/A",
          rate,
        };
      })
      .filter((s): s is NonNullable<typeof s> => s !== null)
      .filter((s) => parseFloat(s.rate) < 75)
      .sort((a, b) => parseFloat(a.rate) - parseFloat(b.rate));

    return {
      weekly,
      monthly: [],
      byUnit,
      byProgram,
      avgRate,
      best,
      worst,
      lowAttendees,
    };
  }

  // --- Sessions Analytics ---
  async getSessionsAnalytics(lecturerId: string) {
    const lecturer = await prisma.lecturer.findUnique({
      where: { id: lecturerId },
      select: {
        universityId: true,
        assignments: {
          include: {
            unit: {
              select: {
                id: true,
                name: true,
                programId: true,
                studyYearId: true,
                program: { select: { name: true } },
                studyYear: { select: { name: true } },
              },
            },
          },
        },
      },
    });
    if (!lecturer) throw new Error("Lecturer not found");

    const assignedUnits = lecturer.assignments.map((a) => a.unit);
    const assignedUnitIds = assignedUnits.map((u) => u.id);
    const totalUnits = assignedUnits.length;

    // ============================================================
    // SEMESTER RESOLUTION
    // ============================================================
    const activeYear = await prisma.academicYear.findFirst({
      where: { status: "ACTIVE", archived: false },
    });
    const currentSemester = await prisma.semester.findFirst({
      where: {
        universityId: lecturer.universityId,
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
    // SESSIONS
    // ============================================================
    const sessions = await prisma.attendanceSession.findMany({
      where: {
        lecturerId,
        unitId: { in: assignedUnitIds },
        status: { not: "ACTIVE" },
        sessionDate: { gte: semesterStart, lte: semesterEnd },
      },
      select: { id: true, unitId: true, sessionDate: true },
    });

    // ============================================================
    // WEEKLY (distinct units delivered / totalUnits)
    // ============================================================
    const weekly = weekBuckets.map((bucket) => {
      const weekSessions = sessions.filter((s) => {
        const d = new Date(s.sessionDate);
        return d >= bucket.start && d <= bucket.end;
      });
      const deliveredUnits = new Set(weekSessions.map((s) => s.unitId)).size;
      const rate =
        totalUnits > 0
          ? Math.min(100, Math.round((deliveredUnits / totalUnits) * 100))
          : 0;
      return { week: bucket.label, rate };
    });

    // ============================================================
    // BY UNIT (all assigned units; rate = held / weeksElapsed)
    // ============================================================
    const unitSessionCount = new Map<string, number>();
    sessions.forEach((s) => {
      unitSessionCount.set(
        s.unitId,
        (unitSessionCount.get(s.unitId) || 0) + 1,
      );
    });

    const byUnit = assignedUnits.map((u) => {
      const held = unitSessionCount.get(u.id) || 0;
      const rate =
        weeksElapsed > 0
          ? Math.min(100, Math.round((held / weeksElapsed) * 100))
          : 0;
      return { id: u.id, name: u.name, rate };
    });

    // ============================================================
    // BY PROGRAM (programId + studyYearId, all his units)
    // ============================================================
    const programAgg = new Map<
      string,
      { name: string; units: Set<string>; held: number }
    >();
    assignedUnits.forEach((u) => {
      const key = `${u.programId}|${u.studyYearId}`;
      if (!programAgg.has(key)) {
        programAgg.set(key, {
          name: `${u.program?.name || "Unknown"} ${u.studyYear?.name || ""}`.trim(),
          units: new Set(),
          held: 0,
        });
      }
      programAgg.get(key)!.units.add(u.id);
    });
    sessions.forEach((s) => {
      const unit = assignedUnits.find((u) => u.id === s.unitId);
      if (!unit) return;
      const key = `${unit.programId}|${unit.studyYearId}`;
      const agg = programAgg.get(key);
      if (!agg) return;
      agg.held += 1;
    });

    const byProgram = Array.from(programAgg.values())
      .map((p) => {
        const expected = p.units.size * weeksElapsed;
        const rate =
          expected > 0
            ? Math.min(100, Math.round((p.held / expected) * 100))
            : 0;
        return { name: p.name, rate };
      })
      .sort((a, b) => b.rate - a.rate);

    // ============================================================
    // OVERALL
    // ============================================================
    const totalExpected = totalUnits * weeksElapsed;
    const avgRate =
      totalExpected > 0
        ? Math.min(100, Math.round((sessions.length / totalExpected) * 100))
        : 0;

    // ============================================================
    // BEST / WORST
    // ============================================================
    const best =
      byUnit.length > 0
        ? byUnit.reduce((a, b) => (a.rate > b.rate ? a : b))
        : null;
    const worst =
      byUnit.length > 0
        ? byUnit.reduce((a, b) => (a.rate < b.rate ? a : b))
        : null;

    // ============================================================
    // INTERVENTION LIST (units < 75%)
    // ============================================================
    const lowUnits = byUnit
      .filter((u) => u.rate < 75)
      .sort((a, b) => a.rate - b.rate);

    return {
      weekly,
      byUnit,
      byProgram,
      avgRate: String(avgRate),
      best,
      worst,
      totalUnits,
      lowUnits,
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

    // Use totalStudents (enrolled) as denominator — matches the modal
    const total = session.totalStudents || 0;
    const present =
      session.records?.filter((r: any) => r.status === "PRESENT").length || 0;
    const rate = total > 0 ? Math.round((present / total) * 100) : 0;

    return {
      session,
      summary: {
        total,
        present,
        absent: Math.max(0, total - present),
        rate,
      },
    };
  }
}
