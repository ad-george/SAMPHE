import { Request, Response, NextFunction } from 'express';
import { NotificationService } from './notification.service';
const service = new NotificationService();

export const create = async (req: Request, res: Response, next: NextFunction) => {
  try { const n = await service.create(req.body); res.status(201).json({ success: true, data: n }); }
  catch (e: any) { next({ statusCode: 400, message: e.message }); }
};
export const getMine = async (req: Request, res: Response, next: NextFunction) => {
  try { const data = await service.getForUser(req.user!.role, req.user!.id); res.json({ success: true, data }); }
  catch (e: any) { next({ statusCode: 400, message: e.message }); }
};
export const markRead = async (req: Request, res: Response, next: NextFunction) => {
  try { const data = await service.markAsRead(req.params.id); res.json({ success: true, data }); }
  catch (e: any) { next({ statusCode: 400, message: e.message }); }
};
export const unreadCount = async (req: Request, res: Response, next: NextFunction) => {
  try { const count = await service.getUnreadCount(req.user!.role, req.user!.id); res.json({ success: true, count }); }
  catch (e: any) { next({ statusCode: 400, message: e.message }); }
};