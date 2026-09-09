import { Request, Response, NextFunction } from 'express';
import { StudyYearService } from './study-year.service';

const service = new StudyYearService();

export const createStudyYear = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const year = await service.create(req.body);
    res.status(201).json({ success: true, data: year });
  } catch (error: any) {
    next({ statusCode: 400, message: error.message });
  }
};

export const getStudyYears = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const years = await service.getAll();
    res.json({ success: true, data: years });
  } catch (error: any) {
    next({ statusCode: 400, message: error.message });
  }
};

export const getStudyYearById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const year = await service.getById(req.params.id);
    if (!year) return next({ statusCode: 404, message: 'Study year not found' });
    res.json({ success: true, data: year });
  } catch (error: any) {
    next({ statusCode: 400, message: error.message });
  }
};

export const updateStudyYear = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const year = await service.update(req.params.id, req.body);
    res.json({ success: true, data: year });
  } catch (error: any) {
    next({ statusCode: 400, message: error.message });
  }
};

export const deleteStudyYear = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await service.delete(req.params.id);
    res.json({ success: true, message: 'Study year deleted' });
  } catch (error: any) {
    next({ statusCode: 400, message: error.message });
  }
};