import { Request, Response, NextFunction } from "express";
import { StudentService } from "./student.service";
import multer from "multer";

const studentService = new StudentService();
const upload = multer({ storage: multer.memoryStorage() });

export const uploadMiddleware = upload.single("file");

export const importStudents = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.file) throw new Error("No file uploaded");
    const universityId = req.user?.universityId || req.body.universityId;
    const result = await studentService.importStudents(
      universityId,
      req.file.buffer,
    );
    res.json({ success: true, data: result });
  } catch (error: any) {
    next({ statusCode: 400, message: error.message });
  }
};

export const getStudents = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const universityId =
      req.user?.universityId || (req.query.universityId as string);
    const students = await studentService.getStudentsByUniversity(
      universityId,
      req.query,
    );
    res.json({ success: true, data: students });
  } catch (error: any) {
    next({ statusCode: 400, message: error.message });
  }
};

export const searchStudent = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { regNo, unitId } = req.query;
    if (!regNo || !unitId) {
      return next({
        statusCode: 400,
        message: "regNo and unitId are required",
      });
    }
    const student = await studentService.searchStudent(
      regNo as string,
      unitId as string,
    );
    res.json({ success: true, data: student });
  } catch (error: any) {
    next({ statusCode: 400, message: error.message });
  }
};

export const getStudentById = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const universityId =
      req.user?.universityId || (req.query.universityId as string);
    const student = await studentService.getStudentById(
      req.params.id,
      universityId,
    );
    if (!student) {
      return next({ statusCode: 404, message: "Student not found" });
    }
    res.json({ success: true, data: student });
  } catch (error: any) {
    next({ statusCode: 400, message: error.message });
  }
};
