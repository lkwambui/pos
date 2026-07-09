import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import * as controller from './branches.controller';
import { createBranchSchema, updateBranchSchema } from './branches.validation';

const router = Router();
router.use(authenticate);
router.use(authorize('Admin'));

router.get('/', controller.list);
router.get('/:id', controller.getById);
router.post('/', validate(createBranchSchema), controller.create);
router.put('/:id', validate(updateBranchSchema), controller.update);
router.delete('/:id', controller.remove);

export default router;
