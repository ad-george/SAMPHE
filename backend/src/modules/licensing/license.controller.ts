import { Request, Response, NextFunction } from "express";
import { LicenseService } from "./license.service";

const service = new LicenseService();

// =========================================================
// CREATE
// =========================================================

export const create = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const license = await service.create(req.body);

    res.status(201).json({
      success: true,
      data: license,
    });
  } catch (e: any) {
    next({
      statusCode: 400,
      message: e.message,
    });
  }
};

// =========================================================
// GET ALL
// =========================================================

export const getAll = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = await service.getAll();

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

// =========================================================
// GET BY ID
// =========================================================

export const getById = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = await service.getById(req.params.id);

    if (!data) {
      return next({
        statusCode: 404,
        message: "License not found",
      });
    }

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

// =========================================================
// GET BY UNIVERSITY
// =========================================================

export const getByUniversity = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = await service.getByUniversity(req.params.universityId);

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

// =========================================================
// UPDATE
// =========================================================

export const update = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = await service.update(req.params.id, req.body);

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

// =========================================================
// GENERATE
// =========================================================

export const generate = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = await service.create(req.body);

    res.status(201).json({
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

// =========================================================
// VALIDATE CODE
// =========================================================

export const validateCode = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { code } = req.params;

    const result = await service.validateCode(code);

    res.json({
      success: true,
      data: result,
    });
  } catch (e: any) {
    next({
      statusCode: 400,
      message: e.message,
    });
  }
};

// =========================================================
// USE LICENSE
// =========================================================

export const useLicense = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { code, universityId, usedBy, licenseType } = req.body;

    const data = await service.useLicense(
      code,
      universityId,
      usedBy,
      licenseType,
    );

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

export const revoke = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = await service.revoke(req.params.id);

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

export const reinstate = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = await service.reinstate(req.params.id);

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

export const suspend = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = await service.suspend(req.params.id);

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

export const remove = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    await service.remove(req.params.id);

    res.json({
      success: true,
      message: "License removed successfully",
    });
  } catch (e: any) {
    next({
      statusCode: 400,
      message: e.message,
    });
  }
};

// =========================================================
// STATS
// =========================================================

export const getStats = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = await service.getStats();

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
