import * as circleService from '../services/circle.service.js';
import {
  validateCreateCircleInput,
  validateAddMemberInput,
  validateCircleIdParam,
} from '../validators/circle.validator.js';

export async function create(req, res, next) {
  try {
    const input = validateCreateCircleInput(req.body);
    const circle = await circleService.createCircle(req.user.id, input);

    res.status(201).json({
      success: true,
      message: 'Circle created successfully',
      data: { circle },
    });
  } catch (error) {
    next(error);
  }
}

export async function listMine(req, res, next) {
  try {
    const circles = await circleService.getMyCircles(req.user.id);

    res.status(200).json({
      success: true,
      data: { circles },
    });
  } catch (error) {
    next(error);
  }
}

export async function getById(req, res, next) {
  try {
    const circleId = validateCircleIdParam(req.params);
    const circle = await circleService.getCircleDetails(req.user.id, circleId);

    res.status(200).json({
      success: true,
      data: { circle },
    });
  } catch (error) {
    next(error);
  }
}

export async function addMember(req, res, next) {
  try {
    const circleId = validateCircleIdParam(req.params);
    const input = validateAddMemberInput(req.body);
    const member = await circleService.addMemberByEmail(req.user.id, circleId, input);

    res.status(201).json({
      success: true,
      message: 'Member added successfully',
      data: { member },
    });
  } catch (error) {
    next(error);
  }
}

export async function listMembers(req, res, next) {
  try {
    const circleId = validateCircleIdParam(req.params);
    const members = await circleService.listMembers(req.user.id, circleId);

    res.status(200).json({
      success: true,
      data: { members },
    });
  } catch (error) {
    next(error);
  }
}

export async function leave(req, res, next) {
  try {
    const circleId = validateCircleIdParam(req.params);
    await circleService.leaveCircle(req.user.id, circleId);

    res.status(200).json({
      success: true,
      message: 'You have left the circle',
    });
  } catch (error) {
    next(error);
  }
}
