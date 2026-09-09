import { Request, Response, NextFunction } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const checkLicenseAccess = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const path = req.path;

  // PUBLIC ROUTES - Check ALL variations
  if (
    path === "/license/activate" ||
    path === "/license/request-new" ||
    path === "/license/status" ||
    path === "/billing" ||
    path === "/license" ||
    path.includes("/auth") ||
    path.includes("/login") ||
    path.includes("/signup") ||
    path.includes("/attend") ||
    path.includes("/university-admin/license/activate") ||
    path.includes("/university-admin/license/request-new") ||
    path.includes("/university-admin/license/status") ||
    path.includes("/university-admin/billing") ||
    path.includes("/university-admin/license")
  ) {
    console.log("✅ Public route, skipping license check");
    return next();
  }

  // Skip for platform admin
  if (
    req.user?.role === "PLATFORM_ADMIN" ||
    req.user?.role === "SYSTEM_OWNER"
  ) {
    return next();
  }

  const universityId = req.user?.universityId;
  if (!universityId) {
    return res.status(403).json({
      success: false,
      message: "Access denied. No university associated with this account.",
    });
  }

  try {
    const license = await prisma.license.findFirst({
      where: {
        universityId,
        status: { in: ["ACTIVE", "USED", "EXPIRED"] },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!license) {
      return res.status(403).json({
        success: false,
        message: "No active license found. Please contact support.",
        code: "NO_LICENSE",
      });
    }

    if (license.accessBlocked) {
      return res.status(403).json({
        success: false,
        message: "Access to this system has been permanently blocked.",
        code: "ACCESS_BLOCKED",
      });
    }

    if (license.status === "REVOKED") {
      const now = new Date();
      if (license.gracePeriodEndsAt && now > license.gracePeriodEndsAt) {
        await prisma.license.update({
          where: { id: license.id },
          data: { accessBlocked: true },
        });
        return res.status(403).json({
          success: false,
          message: "Access blocked. Grace period has ended.",
          code: "ACCESS_BLOCKED",
        });
      }

      const daysLeft = license.gracePeriodEndsAt
        ? Math.ceil(
            (new Date(license.gracePeriodEndsAt).getTime() - now.getTime()) /
              86400000,
          )
        : 0;

      res.setHeader("X-License-Status", "GRACE_PERIOD");
      res.setHeader("X-License-Days-Left", daysLeft.toString());

      if (["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) {
        return res.status(403).json({
          success: false,
          message: `License revoked. ${daysLeft} days of grace period remaining.`,
          code: "GRACE_PERIOD",
          daysLeft,
          canView: true,
          canModify: false,
        });
      }
      return next();
    }

    if (license.expiryDate && new Date(license.expiryDate) < new Date()) {
      if (["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) {
        return res.status(403).json({
          success: false,
          message: "Your license has expired.",
          code: "EXPIRED",
          canView: true,
          canModify: false,
        });
      }

      res.setHeader("X-License-Status", "EXPIRED");
      res.setHeader("X-License-Expiry-Date", license.expiryDate.toISOString());
      return next();
    }

    if (license.expiryDate) {
      const daysLeft = Math.ceil(
        (new Date(license.expiryDate).getTime() - Date.now()) / 86400000,
      );
      if (daysLeft <= 30) {
        res.setHeader("X-License-Status", "EXPIRING_SOON");
        res.setHeader("X-License-Days-Left", daysLeft.toString());
      }
    }

    next();
  } catch (error) {
    next(error);
  }
};
