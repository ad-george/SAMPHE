import { Request, Response, NextFunction } from 'express';
import { ProgrammeService } from './programme.service';
const service = new ProgrammeService();

export const create = async (req: Request, res: Response, next: NextFunction) => {
  try { const p = await service.create(req.body); res.status(201).json({ success: true, data: p }); }
  catch (e: any) { next({ statusCode: 400, message: e.message }); }
};
export const getAll = async (req: Request, res: Response, next: NextFunction) => {
  try { const universityId = req.user?.universityId || req.query.universityId as string; const data = await service.getByUniversity(universityId); res.json({ success: true, data }); }
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