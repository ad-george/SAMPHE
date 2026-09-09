import { Router } from 'express';
import {
  createStudyYear,
  getStudyYears,
  getStudyYearById,
  updateStudyYear,
  deleteStudyYear,
} from './study-year.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { authorize } from '../../middleware/role.middleware';

const router = Router();

router.post('/', authenticate, authorize('HOD', 'PLATFORM_ADMIN'), createStudyYear);
router.get('/', authenticate, getStudyYears);
router.get('/:id', authenticate, getStudyYearById);
router.put('/:id', authenticate, authorize('HOD', 'PLATFORM_ADMIN'), updateStudyYear);
router.delete('/:id', authenticate, authorize('HOD', 'PLATFORM_ADMIN'), deleteStudyYear);

export default router;