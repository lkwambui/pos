import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { z } from 'zod';
import * as controller from './roles.controller';

const router = Router();
router.use(authenticate);
router.use(authorize('Admin'));

const permissionSchema = z.object({
  permissions: z.array(z.object({
    action: z.string(),
    resource: z.string(),
  })),
});

router.get('/', controller.list);
router.get('/:id', controller.getById);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.delete('/:id', controller.remove);
router.put('/:id/permissions', validate(permissionSchema), controller.updatePermissions);

export default router;
