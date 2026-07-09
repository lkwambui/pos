import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import * as controller from './invoices.controller';
import { updateInvoiceSchema } from './invoices.validation';

const router = Router();
router.use(authenticate);

router.get('/', controller.list);
router.get('/number/:invoiceNumber', controller.getByNumber);
router.get('/:id', controller.getById);
router.put('/:id', validate(updateInvoiceSchema), controller.update);
router.post('/:id/send-email', controller.sendByEmail);

export default router;
