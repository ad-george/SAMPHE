import { Request, Response, NextFunction } from "express";
import { PlatformAdminService } from "./platform-admin.service";
const service = new PlatformAdminService();

export const getUniversities = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = await service.getUniversities();
    res.json({ success: true, data });
  } catch (e: any) {
    next({ statusCode: 400, message: e.message });
  }
};
export const createUniversity = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = await service.createUniversity(req.body);
    res.status(201).json({ success: true, data });
  } catch (e: any) {
    next({ statusCode: 400, message: e.message });
  }
};
export const updateUniversity = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = await service.updateUniversity(req.params.id, req.body);
    res.json({ success: true, data });
  } catch (e: any) {
    next({ statusCode: 400, message: e.message });
  }
};
export const deleteUniversity = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = await service.deleteUniversity(req.params.id);

    res.json({
      success: true,
      data,
      message: "University deleted successfully",
    });
  } catch (e: any) {
    next({
      statusCode: 400,
      message: e.message,
    });
  }
};
export const toggleStatus = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = await service.toggleUniversityStatus(
      req.params.id,
      req.body.status,
    );
    res.json({ success: true, data });
  } catch (e: any) {
    next({ statusCode: 400, message: e.message });
  }
};

// License
export const getMyLicense = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = await service.getMyLicense(req.user!.universityId!);
    res.json({ success: true, data });
  } catch (e: any) {
    next({ statusCode: 400, message: e.message });
  }
};

export const getBillingHistory = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = await service.getBillingHistory(req.user!.universityId!);
    res.json({ success: true, data });
  } catch (e: any) {
    next({ statusCode: 400, message: e.message });
  }
};

export const renewLicense = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = await service.renewLicense(
      req.user!.universityId!,
      req.body.durationMonths || 12,
    );
    res.json({ success: true, data });
  } catch (e: any) {
    next({ statusCode: 400, message: e.message });
  }
};

export const upgradeToPerpetual = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = await service.upgradeToPerpetual(req.user!.universityId!);
    res.json({ success: true, data });
  } catch (e: any) {
    next({ statusCode: 400, message: e.message });
  }
};

// Integrations
export const getIntegrations = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = await service.getIntegrations(req.user!.universityId!);
    res.json({ success: true, data });
  } catch (e: any) {
    next({ statusCode: 400, message: e.message });
  }
};

export const upsertIntegration = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = await service.upsertIntegration(
      req.user!.universityId!,
      req.body,
    );
    res.json({ success: true, data });
  } catch (e: any) {
    next({ statusCode: 400, message: e.message });
  }
};

export const toggleIntegration = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = await service.toggleIntegration(
      req.user!.universityId!,
      req.params.type,
      req.body.isActive,
    );
    res.json({ success: true, data });
  } catch (e: any) {
    next({ statusCode: 400, message: e.message });
  }
};

export const deleteIntegration = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = await service.deleteIntegration(
      req.user!.universityId!,
      req.params.type,
    );
    res.json({ success: true, data });
  } catch (e: any) {
    next({ statusCode: 400, message: e.message });
  }
};
export const getStats = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = await service.getPlatformStats();
    res.json({ success: true, data });
  } catch (e: any) {
    next({ statusCode: 400, message: e.message });
  }
};

export const getRecentActivity = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = await service.getRecentActivity();

    res.json({
      success: true,
      data,
    });
  } catch (e: any) {
    next({
      statusCode: 400,
      message: e.message,
    });
  }
};
