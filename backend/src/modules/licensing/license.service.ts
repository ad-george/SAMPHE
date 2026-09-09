import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export class LicenseService {
  // =========================================================
  // CLEAN LICENSE CODE
  // =========================================================

  private cleanLicenseCode(code: string): string {
    return code
      .toUpperCase()
      .trim()
      .replace(/^SUAMP-/, "")
      .replace(/-/g, "");
  }

  // =========================================================
  // DISPLAY LICENSE CODE
  // =========================================================

  formatLicenseCode(code: string): string {
    const clean = this.cleanLicenseCode(code);

    const groups = clean.match(/.{1,4}/g) || [];

    return `SUAMP-${groups.join("-")}`;
  }

  // =========================================================
  // GENERATE LICENSE
  // =========================================================

  private async generateLicense(): Promise<string> {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "";
    for (let i = 0; i < 16; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    const exists = await prisma.license.findUnique({
      where: { code },
    });

    if (exists) return this.generateLicense();
    return code;
  }

  // =========================================================
  // CREATE LICENSE
  // =========================================================

  async create(data: {
    type: string;
    expiryDate?: Date | null;
    universityId?: string | null;
  }) {
    const code = await this.generateLicense();

    return prisma.license.create({
      data: {
        code,
        type: data.type,
        expiryDate: data.expiryDate || null,
        universityId: data.universityId || null,
        status: "UNUSED",
        previousStatus: null,
      },
      include: {
        university: true,
      },
    });
  }

  // =========================================================
  // GET ALL
  // =========================================================

  async getAll() {
    const licenses = await prisma.license.findMany({
      include: {
        university: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return licenses.map((license) => ({
      ...license,

      // Display-only formatted code.
      // Database code remains unchanged.
      displayCode: this.formatLicenseCode(license.code),

      // Expiry is determined from the date.
      effectiveStatus: this.getEffectiveStatus(license),
    }));
  }

  // =========================================================
  // EFFECTIVE STATUS
  // =========================================================

  private getEffectiveStatus(license: any): string {
    if (
      license.expiryDate &&
      new Date(license.expiryDate).getTime() < Date.now() &&
      license.status === "USED"
    ) {
      return "EXPIRED";
    }

    return license.status;
  }

  // =========================================================
  // GET BY ID
  // =========================================================

  async getById(id: string) {
    const license = await prisma.license.findUnique({
      where: { id },
      include: {
        university: true,
      },
    });

    if (!license) {
      return null;
    }

    return {
      ...license,
      displayCode: this.formatLicenseCode(license.code),
      effectiveStatus: this.getEffectiveStatus(license),
    };
  }

  // =========================================================
  // GET BY UNIVERSITY
  // =========================================================

  async getByUniversity(universityId: string) {
    const licenses = await prisma.license.findMany({
      where: {
        universityId,
      },
      include: {
        university: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return licenses.map((license) => ({
      ...license,
      displayCode: this.formatLicenseCode(license.code),
      effectiveStatus: this.getEffectiveStatus(license),
    }));
  }

  // =========================================================
  // UPDATE
  // =========================================================

  async update(id: string, data: any) {
    return prisma.license.update({
      where: { id },
      data,
    });
  }

  // =========================================================
  // VALIDATE LICENSE
  // =========================================================

  async validateCode(code: string): Promise<{
    valid: boolean;
    reason?: string;
    license?: any;
  }> {
    const cleanCode = this.cleanLicenseCode(code);

    const license = await prisma.license.findUnique({
      where: {
        code: cleanCode,
      },
    });

    if (!license) {
      return {
        valid: false,
        reason: "INVALID",
      };
    }

    // -------------------------------------------------------
    // REVOKED
    // -------------------------------------------------------

    if (license.status === "REVOKED") {
      return {
        valid: false,
        reason: "REVOKED",
      };
    }

    // -------------------------------------------------------
    // SUSPENDED
    // -------------------------------------------------------

    if (license.status === "SUSPENDED") {
      return {
        valid: false,
        reason: "SUSPENDED",
      };
    }

    // -------------------------------------------------------
    // EXPIRED
    // -------------------------------------------------------

    if (
      license.expiryDate &&
      new Date(license.expiryDate).getTime() < Date.now()
    ) {
      return {
        valid: false,
        reason: "EXPIRED",
      };
    }

    // -------------------------------------------------------
    // USED
    // -------------------------------------------------------

    if (license.status === "USED") {
      return {
        valid: false,
        reason: "USED",
      };
    }

    // -------------------------------------------------------
    // ONLY UNUSED LICENSES CAN BE ACTIVATED
    // -------------------------------------------------------

    if (license.status !== "UNUSED") {
      return {
        valid: false,
        reason: "INVALID",
      };
    }

    return {
      valid: true,
      license,
    };
  }

  // =========================================================
  // USE / ACTIVATE LICENSE
  // =========================================================

  async useLicense(
    code: string,
    universityId: string,
    usedBy: string,
    licenseType?: string,
  ) {
    const cleanCode = this.cleanLicenseCode(code);

    const result = await this.validateCode(cleanCode);

    if (!result.valid) {
      throw new Error(result.reason || "INVALID");
    }

    if (!result.license) {
      throw new Error("INVALID");
    }

    // -------------------------------------------------------
    // LICENSE TYPE
    // -------------------------------------------------------

    if (licenseType && result.license.type !== licenseType) {
      throw new Error("TYPE_MISMATCH");
    }

    // -------------------------------------------------------
    // ACTIVATE LICENSE + UNIVERSITY
    // -------------------------------------------------------

    return prisma.$transaction(async (tx) => {
      const license = await tx.license.update({
        where: {
          code: cleanCode,
        },
        data: {
          status: "USED",
          previousStatus: null,
          universityId,
          usedBy,
          startDate: new Date(),
        },
      });

      // Activate university
      await tx.university.update({
        where: {
          id: universityId,
        },
        data: {
          status: "ACTIVE",
          licenseType: result.license.type,
        },
      });

      // Activate the university admin(s)
      await tx.universityAdmin.updateMany({
        where: {
          universityId,
        },
        data: {
          status: "ACTIVE",
        },
      });

      // CREATE BILLING EVENT
      await tx.billingEvent.create({
        data: {
          licenseId: license.id,
          universityId: universityId,
          eventType: "ACTIVATION",
          amount:
            license.type === "PERPETUAL" ? 2499 : license.isTrial ? 0 : 299,
          currency: "KES",
          description: `${license.type} license activated${license.isTrial ? " (Trial)" : ""}`,
          status: "COMPLETED",
        },
      });

      return license;
    });
  }

  // =========================================================
  // SUSPEND
  // =========================================================

  async suspend(id: string) {
    const license = await prisma.license.findUnique({
      where: { id },
    });

    if (!license) {
      throw new Error("LICENSE_NOT_FOUND");
    }

    if (license.status === "SUSPENDED") {
      throw new Error("ALREADY_SUSPENDED");
    }

    if (license.status === "REVOKED") {
      throw new Error("REVOKED_CANNOT_SUSPEND");
    }

    const previousStatus = license.status;

    return prisma.license.update({
      where: { id },
      data: {
        status: "SUSPENDED",
        previousStatus,
      },
    });
  }

  // =========================================================
  // REVOKE
  // =========================================================

  async revoke(id: string) {
    const license = await prisma.license.findUnique({
      where: { id },
    });

    if (!license) {
      throw new Error("LICENSE_NOT_FOUND");
    }

    if (license.status === "REVOKED") {
      throw new Error("ALREADY_REVOKED");
    }

    const previousStatus = license.status;

    return prisma.license.update({
      where: { id },
      data: {
        status: "REVOKED",
        previousStatus,
      },
    });
  }

  // --- Sync Expired Licenses ---
  async syncExpiredLicenses() {
    const now = new Date();

    const expiredLicenses = await prisma.license.findMany({
      where: {
        status: { in: ["USED", "ACTIVE"] },
        expiryDate: { lt: now },
      },
    });

    for (const license of expiredLicenses) {
      await prisma.license.update({
        where: { id: license.id },
        data: { status: "EXPIRED" },
      });
    }

    return { updatedCount: expiredLicenses.length };
  }

  // =========================================================
  // REINSTATE
  // =========================================================

  async reinstate(id: string) {
    const license = await prisma.license.findUnique({
      where: { id },
    });

    if (!license) {
      throw new Error("LICENSE_NOT_FOUND");
    }

    if (license.status !== "SUSPENDED" && license.status !== "REVOKED") {
      throw new Error("NOT_REINSTATABLE");
    }

    const restoredStatus = license.previousStatus || "UNUSED";

    // -------------------------------------------------------
    // A license that has already expired by date cannot simply
    // become active again.
    // -------------------------------------------------------

    if (
      restoredStatus === "USED" &&
      license.expiryDate &&
      new Date(license.expiryDate).getTime() < Date.now()
    ) {
      throw new Error("LICENSE_EXPIRED");
    }

    return prisma.license.update({
      where: { id },
      data: {
        status: restoredStatus,
        previousStatus: null,
      },
    });
  }

  // =========================================================
  // REMOVE
  // =========================================================

  async remove(id: string) {
    const license = await prisma.license.findUnique({
      where: { id },
    });

    if (!license) {
      throw new Error("LICENSE_NOT_FOUND");
    }

    return prisma.license.delete({
      where: { id },
    });
  }

  // --- CHECK LICENSE STATUS ---

  async checkLicenseStatus(universityId: string) {
    const license = await prisma.license.findFirst({
      where: { universityId, status: { in: ["ACTIVE", "USED", "EXPIRED"] } },
      orderBy: { createdAt: "desc" },
    });

    if (!license) {
      return {
        valid: false,
        reason: "NO_LICENSE",
        message: "No active license found. Please contact support.",
      };
    }

    // Check if access is blocked
    if (license.accessBlocked) {
      return {
        valid: false,
        reason: "ACCESS_BLOCKED",
        message:
          "Access to this system has been blocked. Please contact support.",
      };
    }

    // Check if license is revoked (grace period)
    if (license.status === "REVOKED") {
      const now = new Date();
      if (license.gracePeriodEndsAt && now > license.gracePeriodEndsAt) {
        // Grace period ended - block access
        await this.blockAccess(license.id);
        return {
          valid: false,
          reason: "ACCESS_BLOCKED",
          message:
            "Access to this system has been blocked. Please contact support.",
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
        message: `Your license has been revoked. You have ${daysLeft} days of grace period remaining.`,
        daysLeft,
        gracePeriodEndsAt: license.gracePeriodEndsAt,
      };
    }

    // Check if expired
    if (license.expiryDate && new Date(license.expiryDate) < new Date()) {
      return {
        valid: false,
        reason: "EXPIRED",
        message:
          "Your license has expired. Please renew to continue using the system.",
      };
    }

    // Check if expiring soon (within 30 days)
    if (license.expiryDate) {
      const daysUntilExpiry = Math.ceil(
        (new Date(license.expiryDate).getTime() - Date.now()) / 86400000,
      );
      if (daysUntilExpiry <= 30) {
        return {
          valid: true,
          expiringSoon: true,
          daysUntilExpiry,
          message: `Your license will expire in ${daysUntilExpiry} days. Please renew soon.`,
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

  async blockAccess(licenseId: string) {
    const license = await prisma.license.update({
      where: { id: licenseId },
      data: {
        accessBlocked: true,
        status: "REVOKED",
      },
    });

    // Block university access
    if (license.universityId) {
      await prisma.university.update({
        where: { id: license.universityId },
        data: {
          licenseRevoked: true,
          accessBlockedAt: new Date(),
        },
      });
    }

    return license;
  }

  async revokeLicense(licenseId: string, reason?: string) {
    const license = await prisma.license.findUnique({
      where: { id: licenseId },
    });

    if (!license) throw new Error("License not found");
    if (license.status === "REVOKED")
      throw new Error("License already revoked");

    const now = new Date();
    const gracePeriodEndsAt = new Date(now);
    gracePeriodEndsAt.setDate(gracePeriodEndsAt.getDate() + 14); // 14 days grace period

    const updated = await prisma.license.update({
      where: { id: licenseId },
      data: {
        status: "REVOKED",
        revokedAt: now,
        gracePeriodEndsAt,
        accessBlocked: false, // Not blocked yet, grace period active
      },
    });

    // Create notification (in-app)
    await prisma.notification.create({
      data: {
        userId: "SYSTEM",
        userType: "SYSTEM",
        universityId: license.universityId || undefined,
        title: "License Revoked",
        message: `Your license has been revoked. You have 14 days of grace period. Please contact support to resolve this.`,
        category: "LICENSE",
      },
    });

    return updated;
  }

  async reinstateLicense(licenseId: string) {
    const license = await prisma.license.findUnique({
      where: { id: licenseId },
    });

    if (!license) throw new Error("License not found");
    if (license.status !== "REVOKED" && license.status !== "SUSPENDED") {
      throw new Error("License is not revoked or suspended");
    }

    const updated = await prisma.license.update({
      where: { id: licenseId },
      data: {
        status: "ACTIVE",
        revokedAt: null,
        gracePeriodEndsAt: null,
        accessBlocked: false,
      },
    });

    // Restore university access
    if (license.universityId) {
      await prisma.university.update({
        where: { id: license.universityId },
        data: {
          licenseRevoked: false,
          accessBlockedAt: null,
        },
      });
    }

    // Create notification
    await prisma.notification.create({
      data: {
        userId: "SYSTEM",
        userType: "SYSTEM",
        universityId: license.universityId || undefined,
        title: "License Reinstated",
        message:
          "Your license has been reinstated. Full access has been restored.",
        category: "LICENSE",
      },
    });

    return updated;
  }

  // --- TRIAL LICENSE ---

  async createTrialLicense(universityId: string, days: number = 30) {
    const code = await this.generateLicense();
    const now = new Date();
    const trialEndsAt = new Date(now);
    trialEndsAt.setDate(trialEndsAt.getDate() + days);

    const license = await prisma.license.create({
      data: {
        code,
        universityId,
        type: "TRIAL",
        status: "ACTIVE",
        isTrial: true,
        startDate: now,
        trialEndsAt,
        expiryDate: trialEndsAt,
      },
    });

    // CREATE BILLING EVENT FOR TRIAL
    await prisma.billingEvent.create({
      data: {
        licenseId: license.id,
        universityId,
        eventType: "ACTIVATION",
        amount: 0,
        currency: "KES",
        description: "Trial license activated",
        status: "COMPLETED",
      },
    });

    return license;
  }

  async convertTrialToSubscription(
    universityId: string,
    durationMonths: number = 12,
  ) {
    const trialLicense = await prisma.license.findFirst({
      where: { universityId, isTrial: true, status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
    });

    if (!trialLicense) throw new Error("No active trial license found");
    if (trialLicense.type !== "TRIAL")
      throw new Error("License is not a trial");

    // Expire the trial
    await prisma.license.update({
      where: { id: trialLicense.id },
      data: { status: "EXPIRED" },
    });

    // Create new subscription license
    const code = await this.generateLicense();
    const now = new Date();
    const expiryDate = new Date(now);
    expiryDate.setMonth(expiryDate.getMonth() + durationMonths);

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
        description: "Converted from Trial to Subscription",
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

    // Expire the trial
    await prisma.license.update({
      where: { id: trialLicense.id },
      data: { status: "EXPIRED" },
    });

    // Create perpetual license
    const code = await this.generateLicense();
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

  // =========================================================
  // STATISTICS
  // =========================================================

  async getStats() {
    const now = new Date();

    const [total, unused, used, suspended, revoked, expired] =
      await Promise.all([
        prisma.license.count(),

        prisma.license.count({
          where: {
            status: "UNUSED",
          },
        }),

        prisma.license.count({
          where: {
            status: "USED",
            OR: [
              {
                expiryDate: null,
              },
              {
                expiryDate: {
                  gte: now,
                },
              },
            ],
          },
        }),

        prisma.license.count({
          where: {
            status: "SUSPENDED",
          },
        }),

        prisma.license.count({
          where: {
            status: "REVOKED",
          },
        }),

        prisma.license.count({
          where: {
            status: "USED",
            expiryDate: {
              lt: now,
            },
          },
        }),
      ]);

    return {
      total,
      unused,
      used,
      suspended,
      revoked,
      expired,
    };
  }
}
