import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import * as controller from './users.controller';
import { createUserSchema, updateUserSchema } from './users.validation';

const router = Router();
router.use(authenticate);
router.use(authorize('Admin'));

router.get('/', controller.list);
router.get('/:id', controller.getById);
router.post('/', validate(createUserSchema), controller.create);
router.put('/:id', validate(updateUserSchema), controller.update);
router.delete('/:id', controller.remove);

export default router;
