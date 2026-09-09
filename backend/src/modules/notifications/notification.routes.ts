import { Router } from 'express';
import { create, getMine, markRead, unreadCount } from './notification.controller';
import { authenticate } from '../../middleware/auth.middleware';
const router = Router();

router.post('/', authenticate, create);
router.get('/mine', authenticate, getMine);
router.get('/unread-count', authenticate, unreadCount);
router.patch('/:id/read', authenticate, markRead);

export default router;