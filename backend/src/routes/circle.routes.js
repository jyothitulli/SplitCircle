import { Router } from 'express';

import * as circleController from '../controllers/circle.controller.js';
import * as settlementController from '../controllers/settlement.controller.js';
import * as choreController from '../controllers/chore.controller.js';
import expenseRoutes from './expense.routes.js';
import circleChoreRouter from './chore.routes.js';
import fairnessRouter from './fairness.routes.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.post('/', circleController.create);
router.get('/', circleController.listMine);
router.use('/:circleId/expenses', expenseRoutes);
router.use('/:circleId/chores', circleChoreRouter);
router.use('/:circleId/fairness', fairnessRouter);
router.get('/:circleId/balances', settlementController.getBalances);
router.get('/:circleId/settlements/optimize', settlementController.optimize);
router.get('/:circleId/chore-analytics', choreController.getAnalytics);
router.get('/:circleId', circleController.getById);
router.post('/:circleId/members', circleController.addMember);
router.get('/:circleId/members', circleController.listMembers);
router.delete('/:circleId/members/me', circleController.leave);

export default router;
