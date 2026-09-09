import { Request, Response, NextFunction } from 'express';
import { UniversityService } from './university.service';
const service = new UniversityService();

export const create = async (req: Request, res: Response, next: NextFunction) => {
  try { const u = await service.create(req.body); res.status(201).json({ success: true, data: u }); }
  catch (e: any) { next({ statusCode: 400, message: e.message }); }
};
export const getAll = async (req: Request, res: Response, next: NextFunction) => {
  try { const data = await service.getAll(); res.json({ success: true, data }); }
  catch (e: any) { next({ statusCode: 400, message: e.message }); }
};
export const getById = async (req: Request, res: Response, next: NextFunction) => {
  try { const data = await service.getById(req.params.id); if (!data) return next({ statusCode: 404, message: 'Not found' }); res.json({ success: true, data }); }
  catch (e: any) { next({ statusCode: 400, message: e.message }); }
};
export const update = async (req: Request, res: Response, next: NextFunction) => {
  try { const data = await service.update(req.params.id, req.body); res.json({ success: true, data }); }
  catch (e: any) { next({ statusCode: 400, message: e.message }); }
};
export const toggleStatus = async (req: Request, res: Response, next: NextFunction) => {
  try { const data = await service.toggleStatus(req.params.id, req.body.status); res.json({ success: true, data }); }
  catch (e: any) { next({ statusCode: 400, message: e.message }); }
};