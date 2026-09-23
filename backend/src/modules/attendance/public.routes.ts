import { Router } from "express";
import {
  getSessionByToken,
  markAttendance,
  searchStudentByName,
} from "../lecturer/lecturer.controller";

const router = Router();

router.get("/attend/:token", getSessionByToken);
router.post("/attend/:token", markAttendance);
router.get("/students/search", searchStudentByName);

export default router;
