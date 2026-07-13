import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import * as controller from './etims.controller';
import { submitInvoiceSchema, updateEtimsSettingsSchema } from './etims.validation';

const router = Router();
router.use(authenticate);

router.get('/overview', controller.getOverview);
router.get('/invoices', controller.getInvoiceLog);
router.get('/stats', controller.getStats);
router.get('/sync-log', controller.getSyncLog);
router.get('/settings', controller.getSettings);

router.post('/submit', authorize('Admin', 'Manager'), validate(submitInvoiceSchema), controller.submitInvoice);
router.post('/:id/retry', authorize('Admin', 'Manager'), controller.retryInvoice);
router.put('/settings', authorize('Admin'), validate(updateEtimsSettingsSchema), controller.updateSettings);

export default router;
