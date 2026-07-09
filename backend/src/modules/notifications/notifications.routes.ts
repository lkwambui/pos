import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import * as controller from './notifications.controller';

const router = Router();
router.use(authenticate);

router.get('/', controller.list);
router.get('/unread/count', controller.getUnreadCount);
router.put('/read-all', controller.markAllAsRead);
router.put('/:id/read', controller.markAsRead);
router.delete('/:id', controller.remove);

export default router;
