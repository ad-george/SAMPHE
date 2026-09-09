import { Request, Response, NextFunction } from "express";
import { LecturerService } from "./lecturer.service";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
const service = new LecturerService();

const getLecturer = async (req: Request) => {
  const lec = await service.getMe(req.user!.id);
  if (!lec) throw new Error("Lecturer not found");
  return lec;
};

export const getMe = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = await service.getMe(req.user!.id);
    res.json({ success: true, data });
  } catch (e: any) {
    next({ statusCode: 400, message: e.message });
  }
};

export const updateMe = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = await service.updateMe(req.user!.id, req.body);
    res.json({ success: true, data });
  } catch (e: any) {
    next({ statusCode: 400, message: e.message });
  }
};

export const getDashboardStats = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = await service.getDashboardStats(req.user!.id);
    res.json({ success: true, data });
  } catch (e: any) {
    next({ statusCode: 400, message: e.message });
  }
};

export const getMyUnits = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = await service.getMyUnits(req.user!.id);
    res.json({ success: true, data });
  } catch (e: any) {
    next({ statusCode: 400, message: e.message });
  }
};

export const createSession = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = await service.createSession(req.user!.id, req.body);
    res.status(201).json({ success: true, data });
  } catch (e: any) {
    next({ statusCode: 400, message: e.message });
  }
};

export const getActiveSession = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = await service.getActiveSession(req.user!.id);
    res.json({ success: true, data });
  } catch (e: any) {
    next({ statusCode: 400, message: e.message });
  }
};

export const getSession = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = await service.getSession(req.params.id);
    res.json({ success: true, data });
  } catch (e: any) {
    next({ statusCode: 400, message: e.message });
  }
};

export const endSession = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = await service.endSession(req.params.id);
    res.json({ success: true, data });
  } catch (e: any) {
    next({ statusCode: 400, message: e.message });
  }
};

export const getHistory = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = await service.getHistory(req.user!.id, req.query);
    res.json({ success: true, data });
  } catch (e: any) {
    next({ statusCode: 400, message: e.message });
  }
};

export const searchStudent = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = await service.searchStudent(
      req.user!.id,
      req.query.q as string,
    );
    res.json({ success: true, data });
  } catch (e: any) {
    next({ statusCode: 400, message: e.message });
  }
};

export const getSessionByToken = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = await service.getSessionByToken(req.params.token);
    res.json({ success: true, data });
  } catch (e: any) {
    next({ statusCode: 400, message: e.message });
  }
};

export const markAttendance = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = await service.markAttendance(req.params.token, req.body, req);
    res.status(201).json({ success: true, data });
  } catch (e: any) {
    if (e.message === "ATTENDANCE_LINK_NOT_FOUND") {
      return res.status(404).json({
        success: false,
        message: "The attendance link is invalid or has expired.",
      });
    }
    next({ statusCode: 400, message: e.message });
  }
};

export const getStudentTracking = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = await service.getStudentTracking(req.params.id, req.user!.id);
    res.json({ success: true, data });
  } catch (e: any) {
    next({ statusCode: 400, message: e.message });
  }
};

export const searchLecturerScope = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = await service.searchLecturerScope(
      req.user!.id,
      req.query.q as string,
    );
    res.json({ success: true, data });
  } catch (e: any) {
    next({ statusCode: 400, message: e.message });
  }
};

export const archiveSession = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = await service.archiveSession(req.user!.id, req.params.id);
    res.json({ success: true, data });
  } catch (e: any) {
    next({ statusCode: 400, message: e.message });
  }
};

export const unarchiveSession = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = await service.unarchiveSession(req.user!.id, req.params.id);
    res.json({ success: true, data });
  } catch (e: any) {
    next({ statusCode: 400, message: e.message });
  }
};

export const getArchived = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = await service.getArchived(req.user!.id);
    res.json({ success: true, data });
  } catch (e: any) {
    next({ statusCode: 400, message: e.message });
  }
};

export const getMyStudents = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = await service.getMyStudents(
      req.user!.id,
      req.query.programId as string,
    );
    res.json({ success: true, data });
  } catch (e: any) {
    next({ statusCode: 400, message: e.message });
  }
};

export const getStudentDetail = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = await service.getStudentDetail(
      req.user!.id,
      req.params.id,
      req.query,
    );
    res.json({ success: true, data });
  } catch (e: any) {
    next({ statusCode: 400, message: e.message });
  }
};

export const deleteSession = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    await service.deleteSession(req.user!.id, req.params.id);
    res.json({ success: true, message: "Deleted" });
  } catch (e: any) {
    next({ statusCode: 400, message: e.message });
  }
};

export const searchStudentByName = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { regNo, unitId } = req.query;

    if (!regNo || !unitId) {
      return next({
        statusCode: 400,
        message: "regNo and unitId are required",
      });
    }

    const student = await prisma.student.findFirst({
      where: {
        regNo: {
          equals: (regNo as string).trim(),
          mode: "insensitive",
        },
        registeredUnits: {
          some: { id: unitId as string },
        },
      },
      select: {
        id: true,
        regNo: true,
        fullName: true,
        email: true,
        phone: true,
      },
    });

    res.json({ success: true, data: student });
  } catch (e: any) {
    next({ statusCode: 400, message: e.message });
  }
};

export const getAnalytics = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = await service.getAnalytics(req.user!.id);
    res.json({ success: true, data });
  } catch (e: any) {
    next({ statusCode: 400, message: e.message });
  }
};

export const exportAttendanceReport = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { sessionId } = req.params;
    const { format } = req.query;

    const data = await service.exportAttendanceReport(
      req.user!.id,
      sessionId,
      format as "pdf" | "excel",
    );

    res.json({ success: true, data });
  } catch (e: any) {
    next({ statusCode: 400, message: e.message });
  }
};
