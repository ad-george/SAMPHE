import { Request, Response, NextFunction } from "express";
import { AuthService } from "./auth.service";

const authService = new AuthService();

export const loginPlatformAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { email, password } = req.body;
    const result = await authService.platformAdminLogin(email, password);
    res.json({ success: true, data: result });
  } catch (error: any) {
    next({ statusCode: 401, message: error.message });
  }
};

export const universityAdminSignup = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const result = await authService.universityAdminSignup(req.body);
    res.status(201).json({ success: true, data: result });
  } catch (error: any) {
    next({ statusCode: 400, message: error.message });
  }
};

export const loginUniversityAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { email, password } = req.body;
    const result = await authService.universityAdminLogin(email, password);
    res.json({ success: true, data: result });
  } catch (error: any) {
    next({ statusCode: 401, message: error.message });
  }
};

export const loginHod = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { email, password } = req.body;
    const result = await authService.hodLogin(email, password);
    res.json({ success: true, data: result });
  } catch (error: any) {
    next({ statusCode: 401, message: error.message });
  }
};

export const loginLecturer = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { email, password } = req.body;
    const result = await authService.lecturerLogin(email, password);
    res.json({ success: true, data: result });
  } catch (error: any) {
    next({ statusCode: 401, message: error.message });
  }
};

export const forgotPassword = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { email } = req.body;
    if (!email) {
      return next({ statusCode: 400, message: "Email is required" });
    }
    const result = await authService.forgotPassword(email);
    res.json({ success: true, message: result.message });
  } catch (e: any) {
    next({ statusCode: 400, message: e.message });
  }
};

export const resetPassword = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return next({
        statusCode: 400,
        message: "Token and new password are required",
      });
    }
    const result = await authService.resetPassword(token, newPassword);
    res.json({ success: true, message: result.message });
  } catch (e: any) {
    next({ statusCode: 400, message: e.message });
  }
};
