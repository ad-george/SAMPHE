import { Request, Response, NextFunction } from 'express';
import { AttendanceService } from './attendance.service';

const service = new AttendanceService();

export const createSession = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const lecturerId = req.user!.id;
    const session = await service.createSession(lecturerId, {
      ...req.body,
      universityId: req.user!.universityId,
    });
    res.json({ success: true, data: session });
  } catch (error: any) {
    next({ statusCode: 400, message: error.message });
  }
};

export const submitAttendance = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token } = req.params;
    const record = await service.submitAttendance(token, req.body, req);
    res.json({ success: true, data: record });
  } catch (error: any) {
    next({ statusCode: 400, message: error.message });
  }
};

export const getLiveAttendance = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sessionId } = req.params;
    const records = await service.getLiveAttendance(sessionId);
    res.json({ success: true, data: records });
  } catch (error: any) {
    next({ statusCode: 400, message: error.message });
  }
};

export const getSession = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token } = req.params;
    const session = await service.getSessionByToken(token);
    res.json({ success: true, data: session });
  } catch (error: any) {
    next({ statusCode: 400, message: error.message });
  }
};

export const closeSession = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sessionId } = req.params;
    const session = await service.closeSession(sessionId, req.user!.id);
    res.json({ success: true, data: session });
  } catch (error: any) {
    next({ statusCode: 400, message: error.message });
  }
};

export const getMySessions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sessions = await service.getLecturerSessions(req.user!.id);
    res.json({ success: true, data: sessions });
  } catch (error: any) {
    next({ statusCode: 400, message: error.message });
  }
};

export const getDepartmentSessions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sessions = await service.getDepartmentSessions(req.user!.departmentId);
    res.json({ success: true, data: sessions });
  } catch (error: any) {
    next({ statusCode: 400, message: error.message });
  }
};