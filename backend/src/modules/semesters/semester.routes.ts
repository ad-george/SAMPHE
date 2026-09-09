import { Router } from 'express';
import { create, getAll, getById, update, remove } from './semester.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { authorize } from '../../middleware/role.middleware';
const router = Router();

router.post('/', authenticate, authorize('HOD', 'PLATFORM_ADMIN'), create);
router.get('/', authenticate, getAll);
router.get('/:id', authenticate, getById);
router.put('/:id', authenticate, authorize('HOD', 'PLATFORM_ADMIN'), update);
router.delete('/:id', authenticate, authorize('HOD', 'PLATFORM_ADMIN'), remove);

export default router;