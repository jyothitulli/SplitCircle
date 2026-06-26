import * as choreService from '../services/chore.service.js';
import { validateCircleIdParam } from '../validators/circle.validator.js';
import {
  validateCreateChoreInput,
  validateAssignChoreInput,
  validateChoreIdParam,
  validateAssignmentIdParam,
} from '../validators/chore.validator.js';

export async function create(req, res, next) {
  try {
    const circleId = validateCircleIdParam(req.params);
    const input = validateCreateChoreInput(req.body);
    const chore = await choreService.createChore(req.user.id, circleId, input);

    res.status(201).json({
      success: true,
      message: 'Chore created successfully',
      data: { chore },
    });
  } catch (error) {
    next(error);
  }
}

export async function assign(req, res, next) {
  try {
    const circleId = validateCircleIdParam(req.params);
    const choreId = validateChoreIdParam(req.params);
    const input = validateAssignChoreInput(req.body);
    const assignment = await choreService.assignChore(req.user.id, circleId, choreId, input);

    res.status(201).json({
      success: true,
      message: 'Chore assigned successfully',
      data: { assignment },
    });
  } catch (error) {
    next(error);
  }
}

export async function complete(req, res, next) {
  try {
    const assignmentId = validateAssignmentIdParam(req.params);
    const assignment = await choreService.completeChoreAssignment(req.user.id, assignmentId);

    res.status(200).json({
      success: true,
      message: 'Chore marked as completed',
      data: { assignment },
    });
  } catch (error) {
    next(error);
  }
}

export async function list(req, res, next) {
  try {
    const circleId = validateCircleIdParam(req.params);
    const chores = await choreService.listChores(req.user.id, circleId);

    res.status(200).json({
      success: true,
      data: { chores },
    });
  } catch (error) {
    next(error);
  }
}

export async function listAssignments(req, res, next) {
  try {
    const circleId = validateCircleIdParam(req.params);
    const assignments = await choreService.listAssignments(req.user.id, circleId);

    res.status(200).json({
      success: true,
      data: { assignments },
    });
  } catch (error) {
    next(error);
  }
}

export async function getAnalytics(req, res, next) {
  try {
    const circleId = validateCircleIdParam(req.params);
    const analytics = await choreService.getChoreAnalytics(req.user.id, circleId);

    res.status(200).json({
      success: true,
      data: { analytics },
    });
  } catch (error) {
    next(error);
  }
}
