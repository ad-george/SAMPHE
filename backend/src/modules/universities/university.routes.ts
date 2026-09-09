import { Router } from 'express';
import { create, getAll, getById, update, toggleStatus } from './university.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { authorize } from '../../middleware/role.middleware';
const router = Router();

router.post('/', authenticate, authorize('PLATFORM_ADMIN'), create);
router.get('/', authenticate, authorize('PLATFORM_ADMIN'), getAll);
router.get('/:id', authenticate, authorize('PLATFORM_ADMIN'), getById);
router.put('/:id', authenticate, authorize('PLATFORM_ADMIN'), update);
router.patch('/:id/status', authenticate, authorize('PLATFORM_ADMIN'), toggleStatus);

export default router;