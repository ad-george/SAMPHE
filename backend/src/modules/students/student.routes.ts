import { Router } from "express";
import {
  importStudents,
  getStudents,
  searchStudent,
  getStudentById,
  uploadMiddleware,
} from "./student.controller";
import { authenticate } from "../../middleware/auth.middleware";
import { authorize } from "../../middleware/role.middleware";

const router = Router();

// Import students (HOD only)
router.post(
  "/import",
  authenticate,
  authorize("HOD", "PLATFORM_ADMIN"),
  uploadMiddleware,
  importStudents,
);

// Get students (HOD, Lecturer)
router.get("/", authenticate, authorize("HOD", "LECTURER"), getStudents);

// Search student by regNo (Lecturer)
router.get("/search", authenticate, authorize("LECTURER"), searchStudent);

// Get student by ID
router.get("/:id", authenticate, authorize("HOD", "LECTURER"), getStudentById);

export default router;
