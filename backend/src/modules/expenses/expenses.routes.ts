import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import * as controller from './expenses.controller';
import {
  createExpenseSchema,
  updateExpenseSchema,
  createCategorySchema,
  updateCategorySchema,
} from './expenses.validation';

const router = Router();
router.use(authenticate);

router.get('/', controller.list);
router.get('/categories', controller.getCategories);
router.get('/:id', controller.getById);
router.post('/', authorize('Admin', 'Manager', 'Accountant'), validate(createExpenseSchema), controller.create);
router.put('/:id', authorize('Admin', 'Manager', 'Accountant'), validate(updateExpenseSchema), controller.update);
router.delete('/:id', authorize('Admin', 'Manager', 'Accountant'), controller.remove);
router.post('/categories', validate(createCategorySchema), controller.createCategory);
router.put('/categories/:id', validate(updateCategorySchema), controller.updateCategory);

export default router;
