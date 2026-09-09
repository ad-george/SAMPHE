import { Request, Response, NextFunction } from 'express';
import { SemesterService } from './semester.service';
const service = new SemesterService();

export const create = async (req: Request, res: Response, next: NextFunction) => {
  try { const s = await service.create(req.body); res.status(201).json({ success: true, data: s }); }
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
export const remove = async (req: Request, res: Response, next: NextFunction) => {
  try { await service.delete(req.params.id); res.json({ success: true, message: 'Deleted' }); }
  catch (e: any) { next({ statusCode: 400, message: e.message }); }
};