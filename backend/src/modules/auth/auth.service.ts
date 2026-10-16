import { prisma } from "../../lib/prisma";
import bcrypt from "bcryptjs";
import { generateToken } from "../../utils/jwt";
import crypto from "crypto";
import emailService from "../../services/email.service";
import {
  signPendingSignup,
  verifyPendingSignup,
} from "../../utils/pendingSignup";

// const prisma = new PrismaClient();

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

  // Stage 1 + 2 — NO database writes. Returns a short-lived signed token.
  async universityAdminSignup(data: {
    institutionType: string;
    licenseType: string;
    institutionName: string;
    institutionEmail: string;
    institutionPhone: string;
    adminFullName: string;
    adminEmail: string;
    adminPhone: string;
    adminPassword: string;
  }) {
    if (!data.adminPassword || data.adminPassword.length < 6) {
      throw new Error("Password must be at least 6 characters");
    }

    const institutionType = (
      data.institutionType || "UNIVERSITY"
    ).toUpperCase();

    // Check email isn't already taken (non-destructive, read-only)
    const existing = await prisma.universityAdmin.findUnique({
      where: { email: data.adminEmail },
    });
    if (existing) throw new Error("Admin email already registered");

    // Hash password before signing (never store raw)
    const adminPasswordHash = await bcrypt.hash(data.adminPassword, 10);

    const token = signPendingSignup({
      institutionType,
      licenseType: data.licenseType || "TRIAL",
      institutionName: data.institutionName,
      institutionEmail: data.institutionEmail,
      institutionPhone: data.institutionPhone,
      adminFullName: data.adminFullName,
      adminEmail: data.adminEmail,
      adminPhone: data.adminPhone,
      adminPasswordHash,
    });

    return {
      pendingToken: token,
      adminEmail: data.adminEmail,
      expiresInMinutes: 10,
    };
  }

  // Stage 3 — validates license + writes EVERYTHING in one transaction.
  async completeUniversityAdminSignup(
    pendingToken: string,
    licenseCode: string,
  ) {
    if (!pendingToken) throw new Error("Missing signup session");
    if (!licenseCode) throw new Error("License code is required");

    // Verify signed token (throws if tampered or expired)
    const pending = verifyPendingSignup(pendingToken);

    // Clean license code (same cleaning as existing activateLicense)
    const cleanCode = licenseCode
      .toUpperCase()
      .trim()
      .replace(/^SUAMP-/, "")
      .replace(/-/g, "");

    if (cleanCode.length !== 16) {
      throw new Error("INVALID");
    }

    // Preload the license outside the transaction so we can give
    // specific error messages.
    const license = await prisma.license.findUnique({
      where: { code: cleanCode },
    });

    if (!license) throw new Error("INVALID");
    if (license.status === "USED" || license.status === "ACTIVE")
      throw new Error("USED");
    if (license.status === "REVOKED") throw new Error("REVOKED");
    if (license.status === "SUSPENDED") throw new Error("SUSPENDED");
    if (license.expiryDate && new Date(license.expiryDate) < new Date())
      throw new Error("EXPIRED");

    // Re-check email uniqueness right before commit (race-condition safe)
    const existing = await prisma.universityAdmin.findUnique({
      where: { email: pending.adminEmail },
    });
    if (existing) throw new Error("Admin email already registered");

    const institutionType = pending.institutionType;
    const isFaculty = isFacultyBased(institutionType);
    const structure = defaultStructureFor(institutionType);

    // ---------- SINGLE TRANSACTION — all or nothing ----------
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create University
      const university = await tx.university.create({
        data: {
          name: pending.institutionName,
          email: pending.institutionEmail,
          phone: pending.institutionPhone,
          category: institutionType,
          status: "ACTIVE",
          licenseType: license.type,
          reportSettings: {
            accentColor: "#10b981",
            showAllStudents: true,
          },
        },
      });

      // 2. Create "General" faculty for non-faculty institutions
      if (!isFaculty) {
        await tx.faculty.create({
          data: { name: "General", universityId: university.id },
        });
      }

      // 3. Study years + semesters/terms
      for (let i = 1; i <= structure.years; i++) {
        const year = await tx.studyYear.create({
          data: {
            name: `Year ${i}`,
            description: `Year ${i} of study`,
            universityId: university.id,
          },
        });

        for (const unitName of structure.timeUnits) {
          await tx.semester.create({
            data: {
              name: unitName,
              universityId: university.id,
              studyYearId: year.id,
            },
          });
        }
      }

      // 4. Create UniversityAdmin (ACTIVE)
      const admin = await tx.universityAdmin.create({
        data: {
          fullName: pending.adminFullName,
          email: pending.adminEmail,
          phone: pending.adminPhone,
          password: pending.adminPasswordHash,
          universityId: university.id,
          category: institutionType,
          status: "ACTIVE",
        },
      });

      // 5. Consume the license
      await tx.license.update({
        where: { id: license.id },
        data: {
          status: "USED",
          universityId: university.id,
          usedBy: admin.email,
          startDate: new Date(),
        },
      });

      // 6. Billing event
      await tx.billingEvent.create({
        data: {
          licenseId: license.id,
          universityId: university.id,
          eventType: "ACTIVATION",
          amount:
            license.type === "PERPETUAL"
              ? 2499
              : license.isTrial
                ? 0
                : 60000,
          currency: "KES",
          description: `${license.type} license activated${
            license.isTrial ? " (Trial)" : ""
          }`,
          status: "COMPLETED",
        },
      });

      return { university, admin };
    });

    return {
      universityId: result.university.id,
      adminId: result.admin.id,
      adminEmail: result.admin.email,
      message: "Account activated. You can now log in.",
    };
  }
}
