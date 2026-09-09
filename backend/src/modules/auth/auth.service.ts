import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { generateToken } from "../../utils/jwt";

const prisma = new PrismaClient();

export class AuthService {
  async platformAdminLogin(email: string, password: string) {
    const admin = await prisma.platformAdmin.findUnique({ where: { email } });
    if (!admin) throw new Error("Invalid credentials");
    if (!admin.password) throw new Error("Invalid credentials");

    const isValid = await bcrypt.compare(password, admin.password);
    if (!isValid) throw new Error("Invalid credentials");

    await prisma.platformAdmin.update({
      where: { id: admin.id },
      data: { lastLogin: new Date() },
    });

    const token = generateToken({
      id: admin.id,
      role: "PLATFORM_ADMIN",
      email: admin.email,
    });
    return {
      token,
      user: {
        id: admin.id,
        fullName: admin.fullName,
        email: admin.email,
        role: "PLATFORM_ADMIN",
      },
    };
  }

  async hodLogin(email: string, password: string) {
    console.log("🔍 Login attempt:", { email });
    const hod = await prisma.hod.findUnique({ where: { email } });
    console.log("📦 Found HOD:", {
      id: hod?.id,
      email: hod?.email,
      status: hod?.status,
      hasPassword: !!hod?.password,
      passwordHash: hod?.password?.substring(0, 20) + "...", // Show first 20 chars
    });
    if (!hod) throw new Error("Invalid credentials");
    if (hod.status !== "ACTIVE")
      throw new Error("Invalid credentials or account inactive");
    if (!hod.password) throw new Error("Invalid credentials");

    // 🔍 Debug the comparison
    console.log("🔑 Comparing password:", {
      inputPassword: password,
      storedHash: hod.password.substring(0, 20) + "...",
    });

    const isValid = await bcrypt.compare(password, hod.password);
    console.log("✅ Password valid:", isValid);
    if (!isValid) throw new Error("Invalid credentials");

    await prisma.hod.update({
      where: { id: hod.id },
      data: { lastLogin: new Date() },
    });

    const token = generateToken({
      id: hod.id,
      role: "HOD",
      email: hod.email,
      universityId: hod.universityId,
    });
    // Get university and department names
    const [university, department] = await Promise.all([
      prisma.university.findUnique({
        where: { id: hod.universityId },
        select: { name: true },
      }),
      prisma.department.findUnique({
        where: { id: hod.departmentId },
        select: { name: true },
      }),
    ]);

    return {
      token,
      user: {
        id: hod.id,
        fullName: hod.fullName,
        email: hod.email,
        role: "HOD",
        universityId: hod.universityId,
        departmentId: hod.departmentId,
        universityName: university?.name || "University",
        departmentName: department?.name || "Department",
      },
    };
  }

  async lecturerLogin(email: string, password: string) {
    const lecturer = await prisma.lecturer.findUnique({ where: { email } });
    if (!lecturer || lecturer.status !== "ACTIVE")
      throw new Error("Invalid credentials or account inactive");
    if (!lecturer.password) throw new Error("Invalid credentials");

    const isValid = await bcrypt.compare(password, lecturer.password);
    if (!isValid) throw new Error("Invalid credentials");

    await prisma.lecturer.update({
      where: { id: lecturer.id },
      data: { lastLogin: new Date() },
    });

    // Get university and department names
    const [university, department] = await Promise.all([
      prisma.university.findUnique({
        where: { id: lecturer.universityId },
        select: { name: true },
      }),
      prisma.department.findUnique({
        where: { id: lecturer.departmentId },
        select: { name: true },
      }),
    ]);

    const token = generateToken({
      id: lecturer.id,
      role: "LECTURER",
      email: lecturer.email,
      universityId: lecturer.universityId,
    });

    return {
      token,
      user: {
        id: lecturer.id,
        fullName: lecturer.fullName,
        email: lecturer.email,
        role: "LECTURER",
        universityId: lecturer.universityId,
        departmentId: lecturer.departmentId,
        universityName: university?.name || "University",
        departmentName: department?.name || "Department", // ✅ Add this
      },
    };
  }

  async universityAdminLogin(email: string, password: string) {
    const admin = await prisma.universityAdmin.findUnique({ where: { email } });
    if (!admin || admin.status !== "ACTIVE")
      throw new Error("Invalid credentials or account inactive");
    if (!admin.password) throw new Error("Invalid credentials");

    const isValid = await bcrypt.compare(password, admin.password);
    if (!isValid) throw new Error("Invalid credentials");

    await prisma.universityAdmin.update({
      where: { id: admin.id },
      data: { lastLogin: new Date() },
    });

    const token = generateToken({
      id: admin.id,
      role: "UNIVERSITY_ADMIN",
      email: admin.email,
      universityId: admin.universityId,
    });
    // Get university name
    const university = await prisma.university.findUnique({
      where: { id: admin.universityId },
      select: { name: true },
    });

    return {
      token,
      user: {
        id: admin.id,
        fullName: admin.fullName,
        email: admin.email,
        role: "UNIVERSITY_ADMIN",
        universityId: admin.universityId,
        universityName: university?.name || "University",
      },
    };
  }

  async universityAdminSignup(data: {
    institutionType: string;
    institutionName: string;
    institutionEmail: string;
    institutionPhone: string;
    capacity: number;
    adminFullName: string;
    adminEmail: string;
    adminPhone: string;
    adminPassword: string;
  }) {
    // Check if admin already exists
    const existing = await prisma.universityAdmin.findUnique({
      where: { email: data.adminEmail },
    });
    if (existing) throw new Error("Admin email already registered");

    // ✅ Validate password
    if (!data.adminPassword || data.adminPassword.length < 6) {
      throw new Error("Password must be at least 6 characters");
    }

    // Create university
    const university = await prisma.university.create({
      data: {
        name: data.institutionName,
        email: data.institutionEmail,
        phone: data.institutionPhone,
        address: data.institutionType,
        status: "PENDING",
      },
    });

    // ✅ AUTO-CREATE STUDY YEARS (Year 1 - 6)
    const studyYearNames = [
      "Year 1",
      "Year 2",
      "Year 3",
      "Year 4",
      "Year 5",
      "Year 6",
    ];
    let firstStudyYearId: string | null = null;
    for (const name of studyYearNames) {
      const created = await prisma.studyYear.create({
        data: {
          name,
          description: `${name} of study`,
          universityId: university.id,
        },
      });
      if (name === "Year 1") firstStudyYearId = created.id;
    }

    // ✅ AUTO-CREATE SEMESTERS (Semester 1 - 3)
    const semesterNames = ["Semester 1", "Semester 2", "Semester 3"];
    for (const name of semesterNames) {
      await prisma.semester.create({
        data: {
          name,
          universityId: university.id,
          studyYearId: firstStudyYearId!,
        },
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.adminPassword, 10);

    // Create university admin
    const admin = await prisma.universityAdmin.create({
      data: {
        fullName: data.adminFullName,
        email: data.adminEmail,
        phone: data.adminPhone,
        password: hashedPassword,
        universityId: university.id,
        status: "PENDING",
      },
    });

    return {
      universityId: university.id,
      adminId: admin.id,
      adminEmail: admin.email,
    };
  }
}
