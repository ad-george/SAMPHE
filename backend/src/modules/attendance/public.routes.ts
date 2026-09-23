import { Router } from "express";
import {
  getSessionByToken,
  markAttendance,
} from "../lecturer/lecturer.controller";

const router = Router();

router.get("/attend/:token", getSessionByToken);
router.post("/attend/:token", markAttendance);

export default router;
