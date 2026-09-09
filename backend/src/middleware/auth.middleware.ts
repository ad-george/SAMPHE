import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwt";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ message: "Unauthorized: No token provided" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token);

    let user: any = null;
    let role = decoded.role;

    if (role === "PLATFORM_ADMIN") {
      user = await prisma.platformAdmin.findUnique({
        where: { id: decoded.id },
      });
    } else if (role === "UNIVERSITY_ADMIN") {
      user = await prisma.universityAdmin.findUnique({
        where: { id: decoded.id },
      });
    } else if (role === "HOD") {
      user = await prisma.hod.findUnique({ where: { id: decoded.id } });
    } else if (role === "LECTURER") {
      user = await prisma.lecturer.findUnique({ where: { id: decoded.id } });
    }

    if (!user) {
      return res.status(401).json({ message: "Unauthorized: User not found" });
    }

    // ✅ Preserve universityId from decoded token
    req.user = {
      ...user,
      role,
      universityId: decoded.universityId || user.universityId,
    };
    next();
  } catch (error) {
    return res.status(401).json({ message: "Unauthorized: Invalid token" });
  }
};
