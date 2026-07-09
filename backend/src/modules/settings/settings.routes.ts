import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import * as controller from './settings.controller';
import { updateSettingSchema, updateBulkSettingsSchema } from './settings.validation';

const router = Router();
router.use(authenticate);
router.use(authorize('Admin'));

router.get('/', controller.list);
router.get('/:key', controller.getByKey);
router.put('/', validate(updateBulkSettingsSchema), controller.updateBulk);
router.put('/:key', validate(updateSettingSchema), controller.update);

export default router;
