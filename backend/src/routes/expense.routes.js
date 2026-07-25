import { Router } from 'express';

import * as expenseController from '../controllers/expense.controller.js';

const router = Router({ mergeParams: true });

router.post('/', expenseController.create);
router.get('/', expenseController.listForCircle);
router.get('/:expenseId', expenseController.getById);
router.patch('/:expenseId', expenseController.update);
router.delete('/:expenseId', expenseController.remove);

export default router;
