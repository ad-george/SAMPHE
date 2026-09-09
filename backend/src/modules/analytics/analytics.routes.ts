import { Router } from 'express';
import { getLecturerAnalytics, getDepartmentAnalytics } from './analytics.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { authorize } from '../../middleware/role.middleware';

const router = Router();

router.get('/lecturer', authenticate, authorize('LECTURER'), getLecturerAnalytics);
router.get('/department', authenticate, authorize('HOD'), getDepartmentAnalytics);

export default router;