import { PrismaClient } from "@prisma/client";
import emailService from "../services/email.service";

const prisma = new PrismaClient();

// Run this function daily
export async function checkLicenseExpiry() {
  console.log("🔍 Checking license expiry...");
  const now = new Date();

  // Find all active licenses with expiry dates
  const licenses = await prisma.license.findMany({
    where: {
      status: { in: ["ACTIVE", "USED"] },
      expiryDate: { not: null },
    },
    include: {
      university: true,
    },
  });

  for (const license of licenses) {
    if (!license.expiryDate) continue;
    if (!license.university?.email) continue;

    const daysLeft = Math.ceil(
      (new Date(license.expiryDate).getTime() - now.getTime()) / 86400000,
    );

    // Send warnings at 30, 15, 7, 3, 1 days
    const warningDays = [30, 15, 7, 3, 1];

    if (warningDays.includes(daysLeft)) {
      await emailService.sendLicenseExpiryWarning(
        license.university.email,
        license.university.name,
        daysLeft,
        license.expiryDate,
      );
      console.log(
        `📧 Sent expiry warning to ${license.university.email} (${daysLeft} days left)`,
      );
    }

    // Send expired notification at 0 days
    if (daysLeft === 0) {
      await emailService.sendLicenseExpired(
        license.university.email,
        license.university.name,
      );
      console.log(
        `📧 Sent expired notification to ${license.university.email}`,
      );
    }
  }

  // Check revoked licenses with grace period
  const revokedLicenses = await prisma.license.findMany({
    where: {
      status: "REVOKED",
      accessBlocked: false,
      gracePeriodEndsAt: { not: null },
    },
    include: {
      university: true,
    },
  });

  for (const license of revokedLicenses) {
    if (!license.gracePeriodEndsAt) continue;
    if (!license.university?.email) continue;

    const daysLeft = Math.ceil(
      (new Date(license.gracePeriodEndsAt).getTime() - now.getTime()) /
        86400000,
    );

    // Send warning at 7 days and 3 days
    if (daysLeft === 7 || daysLeft === 3) {
      await emailService.sendLicenseRevoked(
        license.university.email,
        license.university.name,
        daysLeft,
      );
      console.log(
        `📧 Sent grace period warning to ${license.university.email} (${daysLeft} days left)`,
      );
    }

    // Block access when grace period ends
    if (daysLeft <= 0) {
      await prisma.license.update({
        where: { id: license.id },
        data: {
          accessBlocked: true,
          status: "REVOKED",
        },
      });

      await prisma.university.update({
        where: { id: license.universityId! },
        data: {
          licenseRevoked: true,
          accessRevokedAt: now,
        },
      });

      console.log(`🚫 Access blocked for ${license.university?.name}`);
    }
  }
}

// Auto-expire trials after 30 days
export async function checkTrialExpiry() {
  console.log("🔍 Checking trial expiry...");
  const now = new Date();

  const expiredTrials = await prisma.license.findMany({
    where: {
      isTrial: true,
      status: "ACTIVE",
      trialEndsAt: { lt: now },
    },
    include: {
      university: true,
    },
  });

  for (const trial of expiredTrials) {
    await prisma.license.update({
      where: { id: trial.id },
      data: {
        status: "EXPIRED",
      },
    });

    if (trial.university?.email) {
      await emailService.sendLicenseExpired(
        trial.university.email,
        trial.university.name,
      );
    }

    console.log(`⏰ Trial expired for ${trial.university?.name}`);
  }
}
