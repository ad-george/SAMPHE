import { Router } from 'express';
import {
  createSession,
  submitAttendance,
  getLiveAttendance,
  getSession,
  closeSession,
  getMySessions,
  getDepartmentSessions,
} from './attendance.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { authorize } from '../../middleware/role.middleware';

const router = Router();

router.post('/session', authenticate, authorize('LECTURER'), createSession);
router.get('/my-sessions', authenticate, authorize('LECTURER'), getMySessions);
router.get('/department-sessions', authenticate, authorize('HOD'), getDepartmentSessions);
router.get('/session/:token', getSession);
router.post('/submit/:token', submitAttendance);
router.get('/live/:sessionId', authenticate, authorize('LECTURER', 'HOD'), getLiveAttendance);
router.post('/close/:sessionId', authenticate, authorize('LECTURER'), closeSession);

export default router;