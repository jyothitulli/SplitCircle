import * as fairnessService from '../services/fairness.service.js';
import { validateCircleIdParam } from '../validators/circle.validator.js';

export async function calculate(req, res, next) {
  try {
    const circleId = validateCircleIdParam(req.params);
    const scores = await fairnessService.calculateCircleFairness(req.user.id, circleId);

    res.status(200).json({
      success: true,
      message: 'Fairness scores calculated successfully',
      data: { scores },
    });
  } catch (error) {
    next(error);
  }
}

export async function getLeaderboard(req, res, next) {
  try {
    const circleId = validateCircleIdParam(req.params);
    const leaderboard = await fairnessService.getCircleFairness(req.user.id, circleId);

    res.status(200).json({
      success: true,
      data: { leaderboard },
    });
  } catch (error) {
    next(error);
  }
}
