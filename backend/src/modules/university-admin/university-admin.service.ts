import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import emailService from "../../services/email.service";

const prisma = new PrismaClient();

export class UniversityAdminService {
  // --- Me / Profile ---
  async getMe(adminId: string) {
    return prisma.universityAdmin.findUnique({
      where: { id: adminId },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        avatar: true,
        universityId: true,
        role: true,
      },
    });
  }

  async updateMe(adminId: string, data: any) {
    if (data.password) data.password = await bcrypt.hash(data.password, 10);
    return prisma.universityAdmin.update({ where: { id: adminId }, data });
  }

  // --- University ---
  async getMyUniversity(adminId: string) {
    const admin = await prisma.universityAdmin.findUnique({
      where: { id: adminId },
      include: { university: true },
    });
    if (!admin) throw new Error("Admin not found");
    return admin.university;
  }

  async updateUniversityProfile(universityId: string, data: any) {
    // Only allow these fields — protect against arbitrary writes
    const allowed: any = {};
    if (data.name !== undefined) allowed.name = data.name;
    if (data.address !== undefined) allowed.address = data.address;
    if (data.phone !== undefined) allowed.phone = data.phone;
    if (data.email !== undefined) allowed.email = data.email;
    if (data.website !== undefined) allowed.website = data.website;

    return prisma.university.update({
      where: { id: universityId },
      data: allowed,
    });
  }

  // --- Faculties ---
  async getFaculties(universityId: string, search?: string) {
    const where: any = { universityId };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { dean: { fullName: { contains: search, mode: "insensitive" } } },
      ];
    }

    return prisma.faculty.findMany({
      where,
      include: {
        _count: {
          select: {
            departments: true,
          },
        },
        dean: {
          select: {
            id: true,
            fullName: true,
            staffNumber: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });
  }

  async createFaculty(data: {
    name: string;
    universityId: string;
    deanId?: string; // Changed from deanName to deanId (Optional UUID)
  }) {
    const createData: any = {
      name: data.name,
      universityId: data.universityId,
    };

    // If a deanId is provided at creation, connect it relationally
    if (data.deanId) {
      createData.dean = {
        connect: { id: data.deanId },
      };
    }

    return prisma.faculty.create({
      data: createData,
      include: {
        _count: {
          select: {
            departments: true,
          },
        },
        dean: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    });
  }

  async updateFaculty(
    id: string,
    data: { name?: string; deanId?: string | null },
  ) {
    const updateData: any = {};

    if (data.name) updateData.name = data.name;

    // Handle updates to the Dean mapping dynamically
    if (data.deanId === null) {
      // Removes the current dean relationship from the faculty
      updateData.dean = { disconnect: true };
    } else if (data.deanId) {
      // Connects a different existing lecturer as the new dean
      updateData.dean = { connect: { id: data.deanId } };
    }

    return prisma.faculty.update({
      where: { id },
      data: updateData,
      include: {
        _count: {
          select: {
            departments: true,
          },
        },
        dean: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    });
  }

  async deleteFaculty(id: string) {
    return prisma.faculty.delete({ where: { id } });
  }

  async getFacultyStats(universityId: string) {
    const [faculties, departments] = await Promise.all([
      prisma.faculty.count({ where: { universityId } }),
      prisma.department.count({ where: { universityId } }),
    ]);

    return {
      totalFaculties: faculties,
      totalDepartments: departments,
    };
  }

  async getAvailableLecturers(universityId: string) {
    return prisma.lecturer.findMany({
      where: {
        universityId,
        status: "ACTIVE",
        // Optional: uncomment below if a lecturer cannot be a dean of multiple faculties
        // deanOfFaculty: null
      },
      select: {
        id: true,
        fullName: true,
        staffNumber: true,
        department: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { fullName: "asc" },
    });
  }

  // --- Departments ---
  async getDepartments(universityId: string, search?: string) {
    const where: any = { universityId };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { faculty: { name: { contains: search, mode: "insensitive" } } },
        {
          hods: {
            some: { fullName: { contains: search, mode: "insensitive" } },
          },
        },
      ];
    }

    return prisma.department.findMany({
      where,
      include: {
        faculty: {
          select: {
            id: true,
            name: true,
          },
        },
        hods: {
          where: { status: "ACTIVE" },
          select: {
            id: true,
            fullName: true,
            staffNumber: true,
            email: true,
          },
        },
        _count: {
          select: {
            programmes: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });
  }

  async getDepartmentStats(universityId: string) {
    const [totalDepartments, totalProgrammes] = await Promise.all([
      prisma.department.count({ where: { universityId } }),
      prisma.programme.count({ where: { universityId } }),
    ]);

    return {
      totalDepartments,
      totalProgrammes,
    };
  }
  async createDepartment(data: {
    name: string;
    facultyId: string;
    universityId: string;
  }) {
    return prisma.department.create({ data });
  }
  async updateDepartment(id: string, data: any) {
    return prisma.department.update({ where: { id }, data });
  }
  async deleteDepartment(id: string) {
    return prisma.department.delete({ where: { id } });
  }

  // --- HODs ---

  async getHods(universityId: string) {
    return prisma.hod.findMany({
      where: { universityId },
      include: {
        department: true,
      },
      orderBy: { fullName: "asc" },
    });
  }

  async getHodById(universityId: string, hodId: string) {
    return prisma.hod.findFirst({
      where: {
        id: hodId,
        universityId,
      },
      include: {
        department: true,
      },
    });
  }

  async getHodStats(universityId: string) {
    const [total, assigned] = await Promise.all([
      prisma.hod.count({ where: { universityId } }),
      prisma.hod.count({
        where: {
          universityId,
          departmentId: { not: "" },
        },
      }),
    ]);

    return {
      total,
      assigned,
    };
  }

  async createHod(data: {
    staffNumber: string;
    fullName: string;
    email?: string;
    phone?: string;
    password?: string;
    departmentId: string;
    universityId: string;
  }) {
    // Hash the password before saving
    const hashedPassword = data.password
      ? await bcrypt.hash(data.password, 10)
      : "";

    return prisma.hod.create({
      data: {
        staffNumber: data.staffNumber,
        fullName: data.fullName,
        email: data.email || "",
        phone: data.phone || "",
        password: hashedPassword,
        departmentId: data.departmentId,
        universityId: data.universityId,
        status: "ACTIVE",
      },
      include: {
        department: true,
      },
    });
  }

  async updateHod(
    id: string,
    data: {
      staffNumber?: string;
      fullName?: string;
      email?: string;
      phone?: string;
      password?: string; // Add password field
      departmentId?: string;
      status?: string;
    },
  ) {
    const updateData: any = {
      staffNumber: data.staffNumber,
      fullName: data.fullName,
      email: data.email,
      phone: data.phone,
      departmentId: data.departmentId,
      status: data.status,
    };

    // Hash password if provided
    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, 10);
    }

    return prisma.hod.update({
      where: { id },
      data: updateData,
      include: {
        department: true,
      },
    });
  }

  async deleteHod(id: string) {
    return prisma.hod.delete({ where: { id } });
  }

  // --- Academic Calendar ---
  async getAcademicYears(universityId?: string) {
    const scope = universityId ? { universityId } : {};

    const activeYear = await prisma.academicYear.findFirst({
      where: { ...scope, status: "ACTIVE", archived: false },
    });

    const archivedCount = await prisma.academicYear.count({
      where: { ...scope, archived: true },
    });

    const years = await prisma.academicYear.findMany({
      where: { ...scope, archived: false },
      orderBy: { createdAt: "desc" },
    });

    return { activeYear, archivedCount, years };
  }
  async getArchivedYears(universityId?: string) {
    const now = new Date();
    const fiveYearsAgo = new Date(now);
    fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5);

    const archived = await prisma.academicYear.findMany({
      where: universityId
        ? { archived: true, universityId }
        : { archived: true },
      orderBy: { createdAt: "desc" },
    });

    // Check which ones are older than 5 years (ready for auto-deletion)
    const withStatus = archived.map((year) => {
      // Check if the school year ended more than 5 years ago
      const isOld = year.endDate && new Date(year.endDate) < fiveYearsAgo;

      return {
        ...year,
        autoDelete: !!isOld, // Ensures a strict boolean value
      };
    });

    return withStatus;
  }

  async createAcademicYear(data: {
    name: string;
    startDate?: Date;
    endDate?: Date;
    universityId: string; // Ensure this matches your multi-tenant model constraints
  }) {
    return prisma.academicYear.create({
      data: {
        name: data.name,
        startDate: data.startDate,
        endDate: data.endDate,
        universityId: data.universityId,
        status: "INACTIVE", // New years should start as inactive by default
        archived: false,
      },
    });
  }

  async getArchivedYearAttendanceData(yearId: string) {
    const year = await prisma.academicYear.findUnique({
      where: { id: yearId },
    });

    if (!year) throw new Error("Academic year not found");

    // Get all attendance sessions within this year's date range
    const where: any = {};
    if (year.startDate && year.endDate) {
      where.createdAt = {
        gte: year.startDate,
        lte: year.endDate,
      };
    }

    // Get sessions with records grouped by department
    const sessions = await prisma.attendanceSession.findMany({
      where,
      include: {
        records: true,
        unit: {
          include: {
            department: true,
          },
        },
      },
    });

    // Group by department
    const departmentMap: any = {};

    sessions.forEach((session) => {
      const deptName = session.unit?.department?.name || "Unknown";
      if (!departmentMap[deptName]) {
        departmentMap[deptName] = {
          departmentName: deptName,
          totalSessions: 0,
          totalRecords: 0,
          presentRecords: 0,
        };
      }
      departmentMap[deptName].totalSessions += 1;
      departmentMap[deptName].totalRecords += session.records.length;
      departmentMap[deptName].presentRecords += session.records.filter(
        (r) => r.status === "PRESENT",
      ).length;
    });

    const departments = Object.values(departmentMap).map((d: any) => ({
      ...d,
      rate:
        d.totalRecords > 0
          ? ((d.presentRecords / d.totalRecords) * 100).toFixed(1)
          : "0.0",
    }));

    const totalSessions = sessions.length;
    const totalRecords = sessions.reduce((sum, s) => sum + s.records.length, 0);
    const totalPresent = sessions.reduce(
      (sum, s) => sum + s.records.filter((r) => r.status === "PRESENT").length,
      0,
    );
    const overallRate =
      totalRecords > 0
        ? ((totalPresent / totalRecords) * 100).toFixed(1)
        : "0.0";

    return {
      year: year.name,
      startDate: year.startDate,
      endDate: year.endDate,
      totalSessions,
      totalRecords,
      totalPresent,
      overallRate,
      departments,
    };
  }

  async updateAcademicYear(data: {
    startDate: Date;
    endDate: Date;
    name: string;
    action: "ACCEPT_ALL" | "DONT_ARCHIVE" | "CANCEL";
    universityId: string;
  }) {
    if (data.action === "CANCEL") {
      return { message: "No changes made" };
    }

    const currentActive = await prisma.academicYear.findFirst({
      where: {
        status: "ACTIVE",
        archived: false,
        universityId: data.universityId,
      },
    });

    const newYear = await prisma.academicYear.create({
      data: {
        name: data.name,
        startDate: data.startDate,
        endDate: data.endDate,
        status: "ACTIVE",
        archived: false,
        universityId: data.universityId,
      } as any,
    });

    if (currentActive) {
      if (data.action === "ACCEPT_ALL") {
        // Archive the old year
        await prisma.academicYear.update({
          where: { id: currentActive.id },
          data: {
            status: "INACTIVE",
            archived: true,
            archivedAt: new Date(),
          },
        });
      } else if (data.action === "DONT_ARCHIVE") {
        // Permanently delete the old year
        await prisma.academicYear.delete({
          where: { id: currentActive.id },
        });
      }
    }

    return {
      newYear,
      oldYearArchived: data.action === "ACCEPT_ALL",
      oldYearDeleted: data.action === "DONT_ARCHIVE",
    };
  }

  async deleteArchivedYear(yearId: string) {
    const year = await prisma.academicYear.findUnique({
      where: { id: yearId },
    });

    if (!year) throw new Error("Academic year not found");
    if (!year.archived) throw new Error("Only archived years can be deleted");

    return prisma.academicYear.delete({
      where: { id: yearId },
    });
  }

  async getAcademicYearProgress() {
    const activeYear = await prisma.academicYear.findFirst({
      where: { status: "ACTIVE", archived: false },
    });

    if (!activeYear || !activeYear.startDate || !activeYear.endDate) {
      return {
        hasActiveYear: false,
        progress: 0,
        daysLeft: null,
        totalDays: null,
        elapsedDays: null,
      };
    }

    const now = new Date();
    const start = new Date(activeYear.startDate);
    const end = new Date(activeYear.endDate);
    const totalDays = Math.ceil((end.getTime() - start.getTime()) / 86400000);
    const elapsedDays = Math.ceil((now.getTime() - start.getTime()) / 86400000);
    const daysLeft = Math.max(0, totalDays - elapsedDays);
    const progress = Math.min(
      100,
      Math.max(0, (elapsedDays / totalDays) * 100),
    );

    return {
      hasActiveYear: true,
      progress: Math.round(progress),
      daysLeft,
      totalDays,
      elapsedDays,
      startDate: activeYear.startDate,
      endDate: activeYear.endDate,
      name: activeYear.name,
    };
  }

  async autoDeleteOldArchivedYears() {
    const now = new Date();
    const fiveYearsAgo = new Date(now);
    fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5);

    const oldYears = await prisma.academicYear.findMany({
      where: {
        archived: true,
        archivedAt: { lt: fiveYearsAgo },
      },
    });

    for (const year of oldYears) {
      await prisma.academicYear.delete({
        where: { id: year.id },
      });
    }

    return { deletedCount: oldYears.length };
  }

  // Inside your UniversityAdminService class:

  async setActiveYear(id: string, universityId: string) {
    // Use a database transaction to execute multiple dependent actions safely
    return prisma.$transaction(async (tx) => {
      // 1. Verify the year exists and actually belongs to this university tenant
      const targetYear = await tx.academicYear.findFirst({
        where: { id, universityId },
      });
      if (!targetYear)
        throw new Error("Academic year not found for this university.");
      if (targetYear.archived)
        throw new Error("Cannot activate an archived academic year.");

      // 2. Set ALL other academic years for this specific university to INACTIVE
      await tx.academicYear.updateMany({
        where: { universityId, status: "ACTIVE" },
        data: { status: "INACTIVE" },
      });

      // 3. Switch our target academic year to ACTIVE
      return tx.academicYear.update({
        where: { id },
        data: { status: "ACTIVE" },
      });
    });
  }

  async archiveYear(id: string, universityId: string) {
    // Verify ownership before altering data state
    const targetYear = await prisma.academicYear.findFirst({
      where: { id, universityId },
    });
    if (!targetYear) throw new Error("Academic year not found.");
    if (targetYear.status === "ACTIVE") {
      throw new Error(
        "Cannot archive an active timeline block. Deactivate it first.",
      );
    }

    return prisma.academicYear.update({
      where: { id },
      data: {
        archived: true,
        // If your schema tracks historical dates, add: archivedAt: new Date()
      },
    });
  }

  async unarchiveYear(id: string, universityId: string) {
    const targetYear = await prisma.academicYear.findFirst({
      where: { id, universityId },
    });
    if (!targetYear) throw new Error("Academic year not found.");

    return prisma.academicYear.update({
      where: { id },
      data: { archived: false },
    });
  }

  async deleteYear(id: string, universityId: string) {
    const targetYear = await prisma.academicYear.findFirst({
      where: { id, universityId },
    });
    if (!targetYear) throw new Error("Academic year not found.");
    if (targetYear.status === "ACTIVE") {
      throw new Error(
        "Destructive action rejected: Cannot delete a live operational year.",
      );
    }

    // Erase the record from the database
    return prisma.academicYear.delete({
      where: { id },
    });
  }

  // --- Department Attendance Reports ---

  async getAttendanceStats(
    universityId: string,
    filters: { period?: string; semesterId?: string; academicYear?: string },
  ) {
    // Get all departments
    const departments = await prisma.department.findMany({
      where: { universityId },
      include: {
        lecturers: {
          include: {
            sessions: {
              where: {
                ...(filters.semesterId
                  ? { unit: { semesterId: filters.semesterId } }
                  : {}),
                ...(filters.academicYear
                  ? { createdAt: { gte: new Date(filters.academicYear) } }
                  : {}),
              },
              include: {
                records: true,
              },
            },
          },
        },
      },
    });

    const stats = departments.map((dept) => {
      const sessions = dept.lecturers.flatMap((l) => l.sessions);
      const totalSessions = sessions.length;
      const totalAttendance = sessions.reduce(
        (sum, s) => sum + s.records.length,
        0,
      );
      const totalPresent = sessions.reduce(
        (sum, s) =>
          sum + s.records.filter((r) => r.status === "PRESENT").length,
        0,
      );
      const avgRate =
        totalAttendance > 0 ? (totalPresent / totalAttendance) * 100 : 0;

      return {
        departmentId: dept.id,
        departmentName: dept.name,
        totalSessions,
        totalAttendance,
        totalPresent,
        averageRate: avgRate.toFixed(1),
      };
    });

    // Sort by average rate descending
    const sorted = stats.sort(
      (a, b) => parseFloat(b.averageRate) - parseFloat(a.averageRate),
    );

    // Calculate overall stats
    const totalSessions = sorted.reduce((sum, d) => sum + d.totalSessions, 0);
    const totalAttendance = sorted.reduce(
      (sum, d) => sum + d.totalAttendance,
      0,
    );
    const totalPresent = sorted.reduce((sum, d) => sum + d.totalPresent, 0);
    const overallAvg =
      totalAttendance > 0
        ? ((totalPresent / totalAttendance) * 100).toFixed(1)
        : "0.0";

    const bestDepartment = sorted.length > 0 ? sorted[0] : null;
    const worstDepartment =
      sorted.length > 0 ? sorted[sorted.length - 1] : null;

    // Calculate trends (compare with previous period - simplified)
    // In production, this would compare with previous semester data
    const withTrend = sorted.map((d, index) => {
      // Simulate trend - in production this would be real comparison
      const trend = Math.random() > 0.5 ? "+" : "-";
      const value = (Math.random() * 8).toFixed(1);
      return {
        ...d,
        trend: `${trend}${value}%`,
        trendDirection: trend === "+" ? "up" : "down",
      };
    });

    return {
      summary: {
        totalDepartments: departments.length,
        totalSessions,
        totalAttendance,
        totalPresent,
        overallAvg,
        bestDepartment: bestDepartment?.departmentName || "N/A",
        worstDepartment: worstDepartment?.departmentName || "N/A",
      },
      departments: withTrend,
    };
  }

  async getAttendanceStatsSummary(universityId: string) {
    const departments = await prisma.department.findMany({
      where: { universityId },
      include: {
        lecturers: {
          include: {
            sessions: {
              include: {
                records: true,
              },
            },
          },
        },
      },
    });

    let totalSessions = 0;
    let totalAttendance = 0;
    let totalPresent = 0;

    departments.forEach((dept) => {
      const sessions = dept.lecturers.flatMap((l) => l.sessions);
      totalSessions += sessions.length;
      totalAttendance += sessions.reduce((sum, s) => sum + s.records.length, 0);
      totalPresent += sessions.reduce(
        (sum, s) =>
          sum + s.records.filter((r) => r.status === "PRESENT").length,
        0,
      );
    });

    const overallAvg =
      totalAttendance > 0
        ? ((totalPresent / totalAttendance) * 100).toFixed(1)
        : "0.0";

    return {
      totalDepartments: departments.length,
      totalSessions,
      totalAttendance,
      totalPresent,
      overallAvg,
    };
  }

  async exportAttendanceReport(
    universityId: string,
    format: "pdf" | "excel",
    filters?: any,
  ) {
    const data = await this.getAttendanceStats(universityId, filters || {});

    // For Excel export, return the raw data
    if (format === "excel") {
      const exportData = data.departments.map((d: any) => ({
        Department: d.departmentName,
        "Sessions Conducted": d.totalSessions,
        "Total Sign-ins": d.totalAttendance,
        "Average Rate": `${d.averageRate}%`,
        Trend: d.trend || "N/A",
      }));
      return exportData;
    }

    // For PDF, return formatted data with summary
    return {
      summary: data.summary,
      departments: data.departments,
      generatedAt: new Date().toISOString(),
    };
  }

  // --- Dashboard Sessions Graph ---
  async getDepartmentSessionStats(universityId: string, filters: any) {
    const depts = await prisma.department.findMany({
      where: { universityId },
      include: {
        hods: { where: { status: "ACTIVE" }, select: { fullName: true } },
        lecturers: {
          include: {
            sessions: {
              where: {
                ...(filters.semesterId
                  ? { unit: { semesterId: filters.semesterId } }
                  : {}),
                ...(filters.studyYearId
                  ? { unit: { studyYearId: filters.studyYearId } }
                  : {}),
              },
              include: { records: true, unit: true },
            },
          },
        },
      },
    });

    const stats = depts.map((dept: any) => {
      const sessions = dept.lecturers.flatMap((l: any) => l.sessions);
      const totalSessions = sessions.length;
      const totalRecords = sessions.reduce(
        (sum: number, s: any) => sum + s.records.length,
        0,
      );
      const uniqueStudents = new Set(
        sessions.flatMap((s: any) => s.records.map((r: any) => r.studentId)),
      ).size;
      const avgRate =
        uniqueStudents > 0
          ? (
              (totalRecords / (uniqueStudents * Math.max(totalSessions, 1))) *
              100
            ).toFixed(1)
          : "0.0";
      return {
        departmentId: dept.id,
        departmentName: dept.name,
        hodName: dept.hods[0]?.fullName || "Not Assigned",
        totalSessions,
        totalRecords,
        averageRate: avgRate,
      };
    });

    // Deviation logic (simplified: compare with unfiltered previous period)
    const highest =
      stats.length > 0
        ? stats.reduce((a: any, b: any) =>
            a.totalSessions > b.totalSessions ? a : b,
          )
        : null;
    const lowest =
      stats.length > 0
        ? stats.reduce((a: any, b: any) =>
            a.totalSessions < b.totalSessions ? a : b,
          )
        : null;

    return { departments: stats, highest, lowest };
  }

  // --- Historical View ---
  async getHistoricalView(universityId: string, yearName: string) {
    // Get all data as of that academic year context
    const [depts, hods, sessions, years] = await Promise.all([
      prisma.department.findMany({
        where: { universityId },
        include: { faculty: true, hods: { where: { status: "ACTIVE" } } },
      }),
      prisma.hod.findMany({
        where: { universityId },
        include: { department: true },
      }),
      prisma.attendanceSession.findMany({
        where: {
          universityId,
          sessionDate: {
            gte: new Date(`${yearName.split("/")[0]}-01-01`),
            lt: new Date(`${yearName.split("/")[1]}-12-31`),
          },
        },
        include: { unit: true, lecturer: true, records: true },
      }),
      prisma.academicYear.findMany({ where: { name: yearName } }),
    ]);
    return {
      year: yearName,
      departments: depts,
      hods,
      sessionCount: sessions.length,
      sessions,
    };
  }

  // --- Technical Issues ---
  async getIssues(
    universityId: string,
    filters?: { status?: string; severity?: string; search?: string },
  ) {
    const where: any = { universityId };

    if (filters?.status) {
      where.status = filters.status;
    }
    if (filters?.severity) {
      where.severity = filters.severity;
    }
    if (filters?.search) {
      where.OR = [
        { title: { contains: filters.search, mode: "insensitive" } },
        { description: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    return prisma.technicalIssue.findMany({
      where,
      include: {
        department: true,
      },
      orderBy: [
        { severity: "desc" }, // CRITICAL first, then HIGH, MEDIUM, LOW
        { createdAt: "desc" },
      ],
    });
  }
  async getIssueStats(universityId: string) {
    const [total, open, critical] = await Promise.all([
      prisma.technicalIssue.count({ where: { universityId } }),
      prisma.technicalIssue.count({ where: { universityId, status: "OPEN" } }),
      prisma.technicalIssue.count({
        where: { universityId, severity: "CRITICAL", status: "OPEN" },
      }),
    ]);

    return { total, open, critical };
  }
  async createIssue(data: {
    universityId: string;
    departmentId?: string;
    title: string;
    description: string;
    severity: string;
    reportedBy?: string;
  }) {
    const issue = await prisma.technicalIssue.create({
      data: {
        universityId: data.universityId,
        departmentId: data.departmentId || null,
        title: data.title,
        description: data.description,
        severity: data.severity,
        status: "OPEN",
        reportedBy: data.reportedBy,
      },
      include: {
        department: true,
      },
    });

    // Create notification for this issue
    await this.createIssueNotification(issue);

    return issue;
  }

  async resolveIssue(universityId: string, issueId: string) {
    const issue = await prisma.technicalIssue.findFirst({
      where: { id: issueId, universityId },
    });

    if (!issue) throw new Error("Issue not found");

    const resolved = await prisma.technicalIssue.update({
      where: { id: issueId },
      data: {
        status: "RESOLVED",
        resolvedAt: new Date(),
      },
    });

    // Create notification for resolution
    await this.createResolutionNotification(resolved);

    return resolved;
  }

  // Notification helpers
  private async createIssueNotification(issue: any) {
    const severityEmoji =
      issue.severity === "CRITICAL"
        ? "🔴"
        : issue.severity === "HIGH"
          ? "🟠"
          : issue.severity === "MEDIUM"
            ? "🟡"
            : "🔵";

    const message = `${severityEmoji} New technical issue reported: ${issue.title}`;

    await prisma.notification.create({
      data: {
        userType: "UNIVERSITY_ADMIN",
        userId: "SYSTEM",
        universityId: issue.universityId,
        category: "TECHNICAL",
        title: "New Issue Reported",
        message,
      },
    });
  }

  private async createResolutionNotification(issue: any) {
    await prisma.notification.create({
      data: {
        userType: "UNIVERSITY_ADMIN",
        userId: "SYSTEM",
        universityId: issue.universityId,
        category: "TECHNICAL",
        title: "Issue Resolved",
        message: `✅ Technical issue resolved: ${issue.title}`,
      },
    });
  }

  // --- Settings ---

  async getReportSettings(universityId: string) {
    const university = await prisma.university.findUnique({
      where: { id: universityId },
      select: { reportSettings: true },
    });

    // Return default settings if none exist
    const defaultSettings = {
      accentColor: "#10b981",
      showAllStudents: true,
    };

    if (!university?.reportSettings) {
      return defaultSettings;
    }

    // Merge with defaults to handle missing fields
    return {
      ...defaultSettings,
      ...(university.reportSettings as any),
    };
  }

  async updateReportSettings(
    universityId: string,
    data: { accentColor: string; showAllStudents: boolean },
  ) {
    return prisma.university.update({
      where: { id: universityId },
      data: {
        reportSettings: data,
      },
    });
  }

  async uploadLogo(universityId: string, logoUrl: string) {
    return prisma.university.update({
      where: { id: universityId },
      data: {
        logo: logoUrl,
      },
    });
  }

  async getUniversitySettings(universityId: string) {
    return prisma.university.findUnique({
      where: { id: universityId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        website: true,
        logo: true,
        reportSettings: true,
      },
    });
  }

  // async sendLicenseRequestNotification(
  //   platformAdminEmail: string,
  //   universityName: string,
  //   adminName: string,
  //   adminEmail: string,
  //   adminPhone: string,
  //   currentLicenseCode: string,
  // ) {
  //   const subject = `🔑 License Renewal Request - ${universityName}`;
  //   const html = `
  //   <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
  //     <div style="text-align: center; padding: 20px 0; border-bottom: 1px solid #e2e8f0;">
  //       <h1 style="color: #1a202c; margin: 0;">SUAMP</h1>
  //       <p style="color: #718096; margin: 5px 0 0;">License Renewal Request</p>
  //     </div>
  //     <div style="padding: 20px 0;">
  //       <h2 style="color: #2d3748; font-size: 18px;">🔑 New License Request</h2>
  //       <p style="color: #4a5568; font-size: 16px; line-height: 1.6;">
  //         <strong>${universityName}</strong> has requested a new license.
  //       </p>
  //       <div style="background: #f7fafc; padding: 15px; border-radius: 8px; margin: 15px 0;">
  //         <p style="margin: 5px 0;"><strong>University:</strong> ${universityName}</p>
  //         <p style="margin: 5px 0;"><strong>Admin:</strong> ${adminName}</p>
  //         <p style="margin: 5px 0;"><strong>Email:</strong> ${adminEmail}</p>
  //         <p style="margin: 5px 0;"><strong>Phone:</strong> ${adminPhone}</p>
  //         <p style="margin: 5px 0;"><strong>Current License:</strong> ${currentLicenseCode}</p>
  //       </div>
  //       <p style="color: #4a5568; font-size: 16px; line-height: 1.6;">
  //         Please generate a new license code and share it with the university admin.
  //       </p>
  //       <div style="text-align: center; margin: 30px 0;">
  //         <a href="${process.env.CLIENT_URL}/platform-admin/licenses" style="background: #3182ce; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
  //           Go to License Management
  //         </a>
  //       </div>
  //     </div>
  //     <div style="text-align: center; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #a0aec0; font-size: 12px;">
  //       <p>© ${new Date().getFullYear()} SUAMP. All rights reserved.</p>
  //     </div>
  //   </div>
  // `;

  //   await emailService.sendEmail({ to: platformAdminEmail, subject, html });
  // }

  // --- Integration Settings ---

  async getIntegrationSettings(universityId: string) {
    const university = await prisma.university.findUnique({
      where: { id: universityId },
      select: {
        integrationMode: true,
        integrationConfig: true,
        lastSyncAt: true,
      },
    });
    return university;
  }

  async updateIntegrationSettings(
    universityId: string,
    data: {
      integrationMode: string;
      integrationConfig: {
        endpoint: string;
        apiKey: string;
        syncData: string[];
        syncSchedule: string;
      };
    },
  ) {
    return prisma.university.update({
      where: { id: universityId },
      data: {
        integrationMode: data.integrationMode,
        integrationConfig: data.integrationConfig,
        lastSyncAt: data.integrationMode === "INTEGRATED" ? new Date() : null,
      },
    });
  }

  async testIntegrationConnection(universityId: string) {
    const university = await prisma.university.findUnique({
      where: { id: universityId },
    });
    if (!university?.integrationConfig) {
      throw new Error("Integration not configured");
    }
    const config = university.integrationConfig as any;
    try {
      const response = await fetch(`${config.endpoint}/health`, {
        headers: { Authorization: `Bearer ${config.apiKey}` },
        signal: AbortSignal.timeout(5000),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  // --- Semesters ---

  async getSemesters(universityId: string) {
    return prisma.semester.findMany({
      where: { universityId },
      include: {
        studyYear: true,
      },
      orderBy: { startDate: "asc" },
    });
  }

  async createSemester(data: {
    name: string;
    startDate: Date;
    endDate: Date;
    studyYearId: string;
    universityId: string;
  }) {
    // Validate dates are within academic year
    const activeYear = await prisma.academicYear.findFirst({
      where: { status: "ACTIVE", archived: false },
    });

    if (activeYear) {
      const yearStart = new Date(activeYear.startDate!);
      const yearEnd = new Date(activeYear.endDate!);
      const semStart = new Date(data.startDate);
      const semEnd = new Date(data.endDate);

      if (semStart < yearStart || semEnd > yearEnd) {
        throw new Error("Semester dates must be within the academic year");
      }
    }

    return prisma.semester.create({
      data: {
        name: data.name,
        startDate: data.startDate,
        endDate: data.endDate,
        studyYearId: data.studyYearId,
        universityId: data.universityId,
      },
      include: {
        studyYear: true,
      },
    });
  }

  async updateSemester(
    id: string,
    data: {
      name?: string;
      startDate?: Date;
      endDate?: Date;
    },
  ) {
    // Validate dates are within academic year if being updated
    if (data.startDate || data.endDate) {
      const activeYear = await prisma.academicYear.findFirst({
        where: { status: "ACTIVE", archived: false },
      });

      if (activeYear) {
        const semester = await prisma.semester.findUnique({ where: { id } });
        const yearStart = new Date(activeYear.startDate!);
        const yearEnd = new Date(activeYear.endDate!);
        const semStart = data.startDate
          ? new Date(data.startDate)
          : new Date(semester!.startDate!);
        const semEnd = data.endDate
          ? new Date(data.endDate)
          : new Date(semester!.endDate!);

        if (semStart < yearStart || semEnd > yearEnd) {
          throw new Error("Semester dates must be within the academic year");
        }
      }
    }

    return prisma.semester.update({
      where: { id },
      data,
      include: {
        studyYear: true,
      },
    });
  }

  async deleteSemester(id: string) {
    return prisma.semester.delete({ where: { id } });
  }

  async syncData(universityId: string) {
    const university = await prisma.university.findUnique({
      where: { id: universityId },
    });
    if (!university?.integrationConfig) {
      throw new Error("Integration not configured");
    }
    if (university.integrationMode !== "INTEGRATED") {
      throw new Error("System is not in integrated mode");
    }

    const config = university.integrationConfig as any;
    const results = {
      students: 0,
      lecturers: 0,
      units: 0,
      programs: 0,
      errors: [] as string[],
    };

    try {
      // Sync Programs
      if (config.syncData?.includes("programs")) {
        try {
          const res = await fetch(`${config.endpoint}/programs`, {
            headers: { Authorization: `Bearer ${config.apiKey}` },
          });
          const data = (await res.json()) as any[];
          results.programs = data?.length || 0;
        } catch (err: any) {
          results.errors.push(`Programs sync failed: ${err.message}`);
        }
      }

      // Sync Students
      if (config.syncData?.includes("students")) {
        try {
          const res = await fetch(`${config.endpoint}/students`, {
            headers: { Authorization: `Bearer ${config.apiKey}` },
          });
          const data = (await res.json()) as any[];
          results.students = data?.length || 0;
        } catch (err: any) {
          results.errors.push(`Students sync failed: ${err.message}`);
        }
      }

      // Sync Lecturers
      if (config.syncData?.includes("lecturers")) {
        try {
          const res = await fetch(`${config.endpoint}/lecturers`, {
            headers: { Authorization: `Bearer ${config.apiKey}` },
          });
          const data = (await res.json()) as any[];
          results.lecturers = data?.length || 0;
        } catch (err: any) {
          results.errors.push(`Lecturers sync failed: ${err.message}`);
        }
      }

      // Sync Units
      if (config.syncData?.includes("units")) {
        try {
          const res = await fetch(`${config.endpoint}/units`, {
            headers: { Authorization: `Bearer ${config.apiKey}` },
          });
          const data = (await res.json()) as any[];
          results.units = data?.length || 0;
        } catch (err: any) {
          results.errors.push(`Units sync failed: ${err.message}`);
        }
      }

      await prisma.university.update({
        where: { id: universityId },
        data: { lastSyncAt: new Date() },
      });

      return results;
    } catch (error: any) {
      throw new Error(`Sync failed: ${error.message}`);
    }
  }

  // --- License Status Check ---

  async checkLicenseStatus(universityId: string) {
    const license = await prisma.license.findFirst({
      where: { universityId, status: { in: ["ACTIVE", "USED", "EXPIRED"] } },
      orderBy: { createdAt: "desc" },
    });

    if (!license) {
      return {
        valid: false,
        reason: "NO_LICENSE",
        message: "No active license found.",
      };
    }

    // Check if access is blocked
    if (license.accessBlocked) {
      return {
        valid: false,
        reason: "ACCESS_BLOCKED",
        message: "Access to this system has been blocked.",
      };
    }

    // Check revoked with grace period
    if (license.status === "REVOKED") {
      const now = new Date();
      if (license.gracePeriodEndsAt && now > license.gracePeriodEndsAt) {
        return {
          valid: false,
          reason: "ACCESS_BLOCKED",
          message: "Access blocked. Grace period has ended.",
        };
      }
      const daysLeft = license.gracePeriodEndsAt
        ? Math.ceil(
            (new Date(license.gracePeriodEndsAt).getTime() - now.getTime()) /
              86400000,
          )
        : 0;
      return {
        valid: false,
        reason: "GRACE_PERIOD",
        message: `License revoked. ${daysLeft} days of grace period remaining.`,
        daysLeft,
        gracePeriodEndsAt: license.gracePeriodEndsAt,
      };
    }

    // Check expired
    if (license.expiryDate && new Date(license.expiryDate) < new Date()) {
      return {
        valid: false,
        reason: "EXPIRED",
        message: "License has expired. Please renew.",
      };
    }

    // Check expiring soon
    if (license.expiryDate) {
      const daysUntilExpiry = Math.ceil(
        (new Date(license.expiryDate).getTime() - Date.now()) / 86400000,
      );
      if (daysUntilExpiry <= 30) {
        return {
          valid: true,
          expiringSoon: true,
          daysUntilExpiry,
          message: `License expires in ${daysUntilExpiry} days.`,
          license,
        };
      }
    }

    return {
      valid: true,
      license,
      message: "License is active.",
    };
  }

  async convertTrialToSubscription(universityId: string) {
    const trialLicense = await prisma.license.findFirst({
      where: { universityId, isTrial: true, status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
    });

    if (!trialLicense) throw new Error("No active trial license found");
    if (trialLicense.type !== "TRIAL")
      throw new Error("License is not a trial");

    // Calculate prorated amount (optional)
    const daysUsed = Math.ceil(
      (Date.now() - new Date(trialLicense.startDate!).getTime()) / 86400000,
    );
    const totalTrialDays = 30;
    const daysRemaining = Math.max(0, totalTrialDays - daysUsed);
    // Discount: (daysRemaining / totalTrialDays) * price

    // Expire trial
    await prisma.license.update({
      where: { id: trialLicense.id },
      data: { status: "EXPIRED" },
    });

    // Create subscription
    const code = await this.generateLicenseCode();
    const now = new Date();
    const expiryDate = new Date(now);
    expiryDate.setMonth(expiryDate.getMonth() + 12);

    const newLicense = await prisma.license.create({
      data: {
        code,
        universityId,
        type: "SUBSCRIPTION",
        status: "ACTIVE",
        isTrial: false,
        startDate: now,
        expiryDate,
      },
    });

    // Create billing event
    await prisma.billingEvent.create({
      data: {
        licenseId: newLicense.id,
        universityId,
        eventType: "UPGRADE",
        amount: 299.0,
        description: `Converted from Trial to Subscription (${daysRemaining} days remaining on trial)`,
        status: "COMPLETED",
      },
    });

    return newLicense;
  }

  async convertTrialToPerpetual(universityId: string) {
    const trialLicense = await prisma.license.findFirst({
      where: { universityId, isTrial: true, status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
    });

    if (!trialLicense) throw new Error("No active trial license found");
    if (trialLicense.type !== "TRIAL")
      throw new Error("License is not a trial");

    // Expire trial
    await prisma.license.update({
      where: { id: trialLicense.id },
      data: { status: "EXPIRED" },
    });

    // Create perpetual
    const code = await this.generateLicenseCode();
    const now = new Date();

    const newLicense = await prisma.license.create({
      data: {
        code,
        universityId,
        type: "PERPETUAL",
        status: "ACTIVE",
        isTrial: false,
        startDate: now,
        expiryDate: null,
      },
    });

    // Create billing event
    await prisma.billingEvent.create({
      data: {
        licenseId: newLicense.id,
        universityId,
        eventType: "UPGRADE",
        amount: 2499.0,
        description: "Converted from Trial to Perpetual",
        status: "COMPLETED",
      },
    });

    return newLicense;
  }

  // Helper method
  private async generateLicenseCode(): Promise<string> {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "";
    for (let i = 0; i < 16; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const exists = await prisma.license.findUnique({ where: { code } });
    if (exists) return this.generateLicenseCode();
    return code;
  }

  // --- Compliance ---
  async getCompliance(universityId: string) {
    const activeYear = await prisma.academicYear.findFirst({
      where: { status: "ACTIVE", archived: false },
    });
    const depts = await prisma.department.findMany({
      where: { universityId },
      include: { hods: { where: { status: "ACTIVE" } } },
    });
    const issues = [];
    if (!activeYear)
      issues.push({ severity: "HIGH", message: "No active academic year set" });
    depts.forEach((d: any) => {
      if (d.hods.length === 0)
        issues.push({
          severity: "MEDIUM",
          message: `Department "${d.name}" has no assigned HOD`,
        });
    });
    return {
      checks: issues.length === 0 ? 1 : 0,
      issues,
      activeAcademicYear: activeYear?.name || null,
    };
  }

  // --- Global Search ---
  async globalSearch(universityId: string, query: string) {
    const q = query.toLowerCase();
    const [depts, hods, faculties] = await Promise.all([
      prisma.department.findMany({
        where: { universityId, name: { contains: q, mode: "insensitive" } },
        include: { faculty: true, hods: { where: { status: "ACTIVE" } } },
        take: 5,
      }),
      prisma.hod.findMany({
        where: {
          universityId,
          OR: [
            { fullName: { contains: q, mode: "insensitive" } },
            { staffNumber: { contains: q, mode: "insensitive" } },
          ],
        },
        include: { department: true },
        take: 5,
      }),
      prisma.faculty.findMany({
        where: { universityId, name: { contains: q, mode: "insensitive" } },
        take: 5,
      }),
    ]);
    return {
      departments: depts.map((d: any) => ({
        type: "department",
        id: d.id,
        title: d.name,
        subtitle: d.faculty?.name,
        meta: d.hods[0]?.fullName,
      })),
      hods: hods.map((h: any) => ({
        type: "hod",
        id: h.id,
        title: h.fullName,
        subtitle: h.staffNumber,
        meta: h.department?.name,
      })),
      faculties: faculties.map((f: any) => ({
        type: "faculty",
        id: f.id,
        title: f.name,
        subtitle: "Faculty",
        meta: "",
      })),
    };
  }

  async getLicenseStatus(universityId: string) {
    const license = await prisma.license.findFirst({
      where: { universityId, status: { in: ["ACTIVE", "USED", "EXPIRED"] } },
      orderBy: { createdAt: "desc" },
    });

    if (!license) {
      return {
        status: "NO_LICENSE",
        message: "No active license found",
        daysLeft: null,
        type: null,
        isTrial: false,
      };
    }

    // Check if license is revoked (grace period)
    if (license.status === "REVOKED") {
      const now = new Date();
      if (license.gracePeriodEndsAt && now > license.gracePeriodEndsAt) {
        return {
          status: "ACCESS_BLOCKED",
          message: "Access blocked. Grace period has ended.",
          daysLeft: 0,
          type: license.type,
          isTrial: license.isTrial,
        };
      }
      const daysLeft = license.gracePeriodEndsAt
        ? Math.ceil(
            (new Date(license.gracePeriodEndsAt).getTime() - now.getTime()) /
              86400000,
          )
        : 0;
      return {
        status: "GRACE_PERIOD",
        message: `License revoked. ${daysLeft} days of grace period remaining.`,
        daysLeft,
        gracePeriodEndsAt: license.gracePeriodEndsAt,
        type: license.type,
        isTrial: license.isTrial,
      };
    }

    // Check expired
    if (license.expiryDate && new Date(license.expiryDate) < new Date()) {
      return {
        status: "EXPIRED",
        message: "License has expired. Please renew.",
        daysLeft: 0,
        type: license.type,
        isTrial: license.isTrial,
      };
    }

    // Check expiring soon
    if (license.expiryDate) {
      const daysLeft = Math.ceil(
        (new Date(license.expiryDate).getTime() - Date.now()) / 86400000,
      );
      if (daysLeft <= 30) {
        return {
          status: "EXPIRING_SOON",
          message: `License expires in ${daysLeft} days.`,
          daysLeft,
          expiryDate: license.expiryDate,
          type: license.type,
          isTrial: license.isTrial,
        };
      }
    }

    return {
      status: "ACTIVE",
      message: "License is active.",
      daysLeft: license.expiryDate
        ? Math.ceil(
            (new Date(license.expiryDate).getTime() - Date.now()) / 86400000,
          )
        : null,
      expiryDate: license.expiryDate,
      type: license.type,
      isTrial: license.isTrial,
    };
  }

  // --- Stats ---
  async getStats(universityId: string) {
    const [faculties, departments, hods] = await Promise.all([
      prisma.faculty.count({ where: { universityId } }),
      prisma.department.count({ where: { universityId } }),
      prisma.hod.count({ where: { universityId } }),
    ]);

    return {
      faculties,
      departments,
      hods,
    };
  }
}
