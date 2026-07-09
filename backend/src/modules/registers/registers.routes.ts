import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import * as controller from './registers.controller';
import { createRegisterSchema, updateRegisterSchema } from './registers.validation';

const router = Router();
router.use(authenticate);

router.get('/', controller.list);
router.get('/:id', controller.getById);
router.post('/', authorize('Admin', 'Manager'), validate(createRegisterSchema), controller.create);
router.put('/:id', authorize('Admin', 'Manager'), validate(updateRegisterSchema), controller.update);
router.delete('/:id', authorize('Admin', 'Manager'), controller.remove);

export default router;
