import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { generateToken } from "../../utils/jwt";
import crypto from "crypto";
import emailService from "../../services/email.service";

const prisma = new PrismaClient();

// Institution-type aware structure defaults
const defaultStructureFor = (institutionType: string) => {
  const t = (institutionType || "UNIVERSITY").toUpperCase();

  if (t === "UNIVERSITY") {
    return { years: 6, timeUnits: ["Semester 1", "Semester 2"] };
  }
  if (t === "KMTC") {
    return { years: 3, timeUnits: ["Semester 1", "Semester 2"] };
  }
  if (t === "TTC") {
    return { years: 3, timeUnits: ["Term 1", "Term 2", "Term 3"] };
  }
  if (t === "NATIONAL_POLYTECHNIC" || t === "TTI") {
    return { years: 3, timeUnits: ["Term 1", "Term 2", "Term 3"] };
  }
  // Fallback
  return { years: 6, timeUnits: ["Semester 1", "Semester 2"] };
};

const isFacultyBased = (institutionType: string) => {
  const t = (institutionType || "UNIVERSITY").toUpperCase();
  return t === "UNIVERSITY" || t === "KMTC";
};

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
        select: { name: true, category: true },
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
        institutionType: university?.category || "UNIVERSITY",
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
        select: { name: true, category: true },
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
        departmentName: department?.name || "Department", 
        institutionType: university?.category || "UNIVERSITY",
      },
    };
  }

  async forgotPassword(email: string) {
    const lecturer = await prisma.lecturer.findUnique({
      where: { email },
    });

    // Do not reveal whether the email exists — always return success
    if (!lecturer) {
      return { message: "If that email exists, a reset link has been sent." };
    }

    // Generate a secure random token
    const token = crypto.randomBytes(32).toString("hex");
    const expiry = new Date(Date.now() + 15 * 60 * 1000); // 15 min

    await prisma.lecturer.update({
      where: { id: lecturer.id },
      data: {
        resetToken: token,
        resetTokenExpiry: expiry,
      },
    });

    const resetLink = `${process.env.CLIENT_URL}/reset-password/${token}`;

    await emailService.sendPasswordResetEmail(
      lecturer.email,
      lecturer.fullName,
      resetLink,
    );

    return {
      message: "If that email exists, a reset link has been sent.",
    };
  }

  async resetPassword(token: string, newPassword: string) {
    if (!newPassword || newPassword.length < 6) {
      throw new Error("Password must be at least 6 characters");
    }

    const lecturer = await prisma.lecturer.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: { gte: new Date() },
      },
    });

    if (!lecturer) {
      throw new Error("Invalid or expired reset link");
    }

    const hashed = await bcrypt.hash(newPassword, 10);

    await prisma.lecturer.update({
      where: { id: lecturer.id },
      data: {
        password: hashed,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    return { message: "Password reset successfully. You can now log in." };
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
      select: { name: true, category: true },
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
        institutionType: university?.category || "UNIVERSITY",
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
    const existing = await prisma.universityAdmin.findUnique({
      where: { email: data.adminEmail },
    });
    if (existing) throw new Error("Admin email already registered");

    if (!data.adminPassword || data.adminPassword.length < 6) {
      throw new Error("Password must be at least 6 characters");
    }

    const institutionType = (data.institutionType || "UNIVERSITY").toUpperCase();

    // Create university with proper category
    const university = await prisma.university.create({
      data: {
        name: data.institutionName,
        email: data.institutionEmail,
        phone: data.institutionPhone,
        category: institutionType, // ← proper field
        status: "PENDING",
      },
    });

    // Create "General" faculty for non-faculty institutions (hidden on UI)
    if (!isFacultyBased(institutionType)) {
      await prisma.faculty.create({
        data: {
          name: "General",
          universityId: university.id,
        },
      });
    }

    // Auto-create study years + time units
    const { years, timeUnits } = defaultStructureFor(institutionType);

    const yearIds: string[] = [];
    for (let i = 1; i <= years; i++) {
      const y = await prisma.studyYear.create({
        data: {
          name: `Year ${i}`,
          description: `Year ${i} of study`,
          universityId: university.id,
        },
      });
      yearIds.push(y.id);

      // Create time units for this year
      for (const unitName of timeUnits) {
        await prisma.semester.create({
          data: {
            name: unitName,
            universityId: university.id,
            studyYearId: y.id,
          },
        });
      }
    }

    const hashedPassword = await bcrypt.hash(data.adminPassword, 10);

    const admin = await prisma.universityAdmin.create({
      data: {
        fullName: data.adminFullName,
        email: data.adminEmail,
        phone: data.adminPhone,
        password: hashedPassword,
        universityId: university.id,
        category: institutionType,
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
