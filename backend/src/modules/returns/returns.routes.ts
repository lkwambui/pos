import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import * as controller from './returns.controller';
import { createReturnSchema } from './returns.validation';

const router = Router();
router.use(authenticate);

router.get('/', controller.list);
router.get('/:id', controller.getById);
router.post('/', validate(createReturnSchema), controller.create);
router.post('/:id/approve', controller.approve);
router.post('/:id/reject', controller.reject);

export default router;
