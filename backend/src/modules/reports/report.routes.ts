import { Router } from 'express';
import { getReport, downloadPDF, downloadExcel } from './report.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { authorize } from '../../middleware/role.middleware';

const router = Router();

router.get('/:sessionId', authenticate, authorize('LECTURER', 'HOD'), getReport);
router.get('/:sessionId/pdf', authenticate, authorize('LECTURER', 'HOD'), downloadPDF);
router.get('/:sessionId/excel', authenticate, authorize('LECTURER', 'HOD'), downloadExcel);

export default router;