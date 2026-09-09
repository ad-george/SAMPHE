import { Request, Response, NextFunction } from 'express';
import { AnalyticsService } from './analytics.service';

const service = new AnalyticsService();

export const getLecturerAnalytics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await service.getLecturerStats(req.user!.id);
    res.json({ success: true, data });
  } catch (error: any) {
    next({ statusCode: 400, message: error.message });
  }
};

export const getDepartmentAnalytics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await service.getDepartmentStats(req.user!.departmentId);
    res.json({ success: true, data });
  } catch (error: any) {
    next({ statusCode: 400, message: error.message });
  }
};