import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export class PlatformAdminService {
  async getUniversities() {
    return prisma.university.findMany({
      include: {
        _count: {
          select: {
            faculties: true,
            departments: true,
            programmes: true,
            students: true,
            lecturers: true,
          },
        },
        admins: {
          select: {
            category: true,
            licenseType: true,
          },
          take: 1,
        },
        licenses: {
          select: {
            id: true,
            code: true,
            type: true,
            status: true,
            startDate: true,
            expiryDate: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  async getRecentActivity() {
    return prisma.auditLog.findMany({
      orderBy: {
        timestamp: "desc",
      },
      take: 5,
      include: {
        university: {
          select: {
            name: true,
          },
        },
      },
    });
  }
  async createUniversity(data: {
    name: string;
    category?: string;
    email?: string;
    phone?: string;
    address?: string;
    website?: string;
    licenseType?: string;
  }) {
    return prisma.university.create({
      data: {
        name: data.name,
        category: data.category || "UNIVERSITY",
        email: data.email,
        phone: data.phone,
        address: data.address,
        website: data.website,
        // licenseType: data.licenseType || "SUBSCRIPTION",
        status: "PENDING",
      },
    });
  }
  async updateUniversity(id: string, data: any) {
    return prisma.university.update({ where: { id }, data });
  }
  async deleteUniversity(id: string) {
    return prisma.$transaction(async (tx) => {
      const university = await tx.university.findUnique({
        where: { id },
        include: {
          licenses: true,
        },
      });

      if (!university) {
        throw new Error("UNIVERSITY_NOT_FOUND");
      }

      // Make the institution's license available again.
      // The expiryDate is deliberately preserved.
      await tx.license.updateMany({
        where: {
          universityId: id,
        },
        data: {
          status: "UNUSED",
          universityId: null,
          usedBy: null,
        },
      });

      // Remove dependent records belonging to the university.
      await tx.attendanceRecord.deleteMany({
        where: {
          session: {
            universityId: id,
          },
        },
      });

      await tx.attendanceCorrection.deleteMany({
        where: {
          lecturer: {
            universityId: id,
          },
        },
      });

      await tx.attendanceSession.deleteMany({
        where: {
          universityId: id,
        },
      });

      await tx.lecturerUnitAssignment.deleteMany({
        where: {
          lecturer: {
            universityId: id,
          },
        },
      });

      await tx.unit.deleteMany({
        where: {
          universityId: id,
        },
      });

      await tx.lecturer.deleteMany({
        where: {
          universityId: id,
        },
      });

      await tx.hod.deleteMany({
        where: {
          universityId: id,
        },
      });

      await tx.student.deleteMany({
        where: {
          universityId: id,
        },
      });

      await tx.programme.deleteMany({
        where: {
          universityId: id,
        },
      });

      await tx.department.deleteMany({
        where: {
          universityId: id,
        },
      });

      await tx.faculty.deleteMany({
        where: {
          universityId: id,
        },
      });

      await tx.universityAdmin.deleteMany({
        where: {
          universityId: id,
        },
      });

      await tx.auditLog.deleteMany({
        where: {
          universityId: id,
        },
      });

      await tx.notification.deleteMany({
        where: {
          universityId: id,
        },
      });

      await tx.technicalIssue.deleteMany({
        where: {
          universityId: id,
        },
      });

      await tx.integrationSetting.deleteMany({
        where: {
          universityId: id,
        },
      });

      return tx.university.delete({
        where: {
          id,
        },
      });
    });
  }
  async toggleUniversityStatus(id: string, status: string) {
    return prisma.$transaction(async (tx) => {
      const university = await tx.university.findUnique({
        where: { id },
        include: {
          licenses: {
            where: {
              status: {
                in: ["USED", "SUSPENDED"],
              },
            },
            orderBy: {
              createdAt: "desc",
            },
            take: 1,
          },
        },
      });

      if (!university) {
        throw new Error("UNIVERSITY_NOT_FOUND");
      }

      await tx.university.update({
        where: { id },
        data: { status },
      });

      const license = university.licenses[0];
      const suspendedAt = new Date();

      const accessRevokedAt = new Date(suspendedAt);
      accessRevokedAt.setDate(accessRevokedAt.getDate() + 14);

      if (license) {
        await tx.license.update({
          where: { id: license.id },
          data: {
            status: status === "SUSPENDED" ? "SUSPENDED" : "USED",
          },
        });
      }

      return tx.university.findUnique({
        where: { id },
      });
    });
  }

  // --- License & Subscription ---

  async getMyLicense(universityId: string) {
    return prisma.license.findFirst({
      where: { universityId },
      orderBy: { createdAt: "desc" },
    });
  }

  async getBillingHistory(universityId: string) {
    return prisma.billingEvent.findMany({
      where: { universityId },
      orderBy: { createdAt: "desc" },
    });
  }

  // --- Integrations ---

  async getIntegrations(universityId: string) {
    return prisma.integrationSetting.findMany({
      where: { universityId },
    });
  }

  async upsertIntegration(
    universityId: string,
    data: { type: string; config: any; isActive: boolean },
  ) {
    const existing = await prisma.integrationSetting.findFirst({
      where: { universityId, type: data.type },
    });

    if (existing) {
      return prisma.integrationSetting.update({
        where: { id: existing.id },
        data: {
          config: data.config ? JSON.stringify(data.config) : null,
          isActive: data.isActive,
          lastSync: data.isActive ? new Date() : undefined,
        },
      });
    }

    return prisma.integrationSetting.create({
      data: {
        universityId,
        type: data.type,
        config: data.config ? JSON.stringify(data.config) : null,
        isActive: data.isActive,
      },
    });
  }

  async toggleIntegration(
    universityId: string,
    type: string,
    isActive: boolean,
  ) {
    const integration = await prisma.integrationSetting.findFirst({
      where: { universityId, type },
    });

    if (!integration) throw new Error("Integration not found");

    return prisma.integrationSetting.update({
      where: { id: integration.id },
      data: {
        isActive,
        lastSync: isActive ? new Date() : undefined,
      },
    });
  }

  async deleteIntegration(universityId: string, type: string) {
    return prisma.integrationSetting.deleteMany({
      where: { universityId, type },
    });
  }

  async renewLicense(universityId: string, durationMonths: number) {
    const license = await prisma.license.findFirst({
      where: { universityId, status: { in: ["ACTIVE", "USED"] } },
      orderBy: { createdAt: "desc" },
    });

    if (!license) throw new Error("No active license found");

    // Check if expired - expired licenses cannot be renewed
    if (license.expiryDate && new Date(license.expiryDate) < new Date()) {
      throw new Error("Cannot renew expired license. Please contact support.");
    }

    // Check if perpetual - perpetual licenses don't need renewal
    if (license.type === "PERPETUAL") {
      throw new Error("Perpetual license does not require renewal.");
    }

    // Calculate new expiry date
    const newExpiry = license.expiryDate
      ? new Date(license.expiryDate)
      : new Date();
    newExpiry.setMonth(newExpiry.getMonth() + durationMonths);

    // Update license
    const updated = await prisma.license.update({
      where: { id: license.id },
      data: {
        expiryDate: newExpiry,
        status: "ACTIVE",
      },
    });

    // Create billing event
    await prisma.billingEvent.create({
      data: {
        licenseId: license.id,
        universityId,
        eventType: "RENEWAL",
        amount: 299.0,
        description: `${durationMonths} month subscription renewal`,
        status: "COMPLETED",
      },
    });

    return updated;
  }

  async upgradeToPerpetual(universityId: string) {
    const license = await prisma.license.findFirst({
      where: { universityId, status: { in: ["ACTIVE", "USED"] } },
      orderBy: { createdAt: "desc" },
    });

    if (!license) throw new Error("No active license found");

    if (license.type === "PERPETUAL") {
      throw new Error("Already a perpetual license.");
    }

    const updated = await prisma.license.update({
      where: { id: license.id },
      data: {
        type: "PERPETUAL",
        expiryDate: null,
        status: "ACTIVE",
      },
    });

    await prisma.billingEvent.create({
      data: {
        licenseId: license.id,
        universityId,
        eventType: "UPGRADE",
        amount: 2499.0,
        description: "Upgrade from Subscription to Perpetual",
        status: "COMPLETED",
      },
    });

    return updated;
  }

  async getPlatformStats() {
    const now = new Date();

    const [
      activeUniversities,
      totalUniversities,
      totalDepartments,
      totalLicenses,
      activeLicenses,
      unusedLicenses,
      expiredLicenses,
      revokedLicenses,
      suspendedLicenses,
    ] = await Promise.all([
      // Active universities
      prisma.university.count({
        where: {
          status: "ACTIVE",
        },
      }),

      // All universities
      prisma.university.count(),

      // All departments
      prisma.department.count(),

      // Every license still existing in the database
      prisma.license.count(),

      // Active licenses:
      // USED + not expired.
      // expiryDate = null means perpetual, therefore active.
      prisma.license.count({
        where: {
          status: "USED",
          OR: [{ expiryDate: null }, { expiryDate: { gte: now } }],
        },
      }),

      // Unused licenses
      prisma.license.count({
        where: {
          status: "UNUSED",
        },
      }),

      // Expired licenses
      prisma.license.count({
        where: {
          expiryDate: {
            lt: now,
          },
          status: {
            notIn: ["REVOKED", "SUSPENDED"],
          },
        },
      }),

      // Revoked licenses
      prisma.license.count({
        where: {
          status: "REVOKED",
        },
      }),

      // Suspended licenses
      prisma.license.count({
        where: {
          status: "SUSPENDED",
        },
      }),
    ]);

    // Prevent division by zero
    const percentage = (count: number) =>
      totalLicenses === 0
        ? 0
        : Number(((count / totalLicenses) * 100).toFixed(1));

    return {
      activeUniversities,
      totalUniversities,
      totalDepartments,

      // Total number of licenses ever generated
      // that have NOT been removed.
      totalLicenses,

      // Counts
      activeLicenses,
      unusedLicenses,
      expiredLicenses,
      revokedLicenses,
      suspendedLicenses,

      // Percentages
      activeLicensePercentage: percentage(activeLicenses),
      unusedLicensePercentage: percentage(unusedLicenses),
      expiredLicensePercentage: percentage(expiredLicenses),

      revokedSuspendedLicensePercentage: percentage(
        revokedLicenses + suspendedLicenses,
      ),
    };
  }
}
