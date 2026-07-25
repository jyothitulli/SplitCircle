import { Router } from 'express';
import * as choreController from '../controllers/chore.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

// Router for circle-scoped chores: /api/circles/:circleId/chores
const circleChoreRouter = Router({ mergeParams: true });

circleChoreRouter.use(authenticate);

circleChoreRouter.post('/', choreController.create);
circleChoreRouter.get('/', choreController.list);
circleChoreRouter.get('/assignments', choreController.listAssignments);
circleChoreRouter.post('/:choreId/assign', choreController.assign);

export default circleChoreRouter;

// Router for global chore assignments: /api/chores/assignments
export const choreAssignmentRouter = Router();

choreAssignmentRouter.use(authenticate);

choreAssignmentRouter.post('/:id/complete', choreController.complete);
