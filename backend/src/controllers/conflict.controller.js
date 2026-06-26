import { predictCircleConflicts } from '../services/conflict.service.js';
import { requireCircleMembership } from '../utils/membership.js';
import logger from '../utils/logger.js';

/**
 * GET /api/circles/:circleId/conflicts
 *
 * Returns a rule-based conflict risk assessment for the circle.
 * Requires the requesting user to be a member.
 */
export async function getConflictPrediction(req, res, next) {
  try {
    const { circleId } = req.params;

    await requireCircleMembership(req.user.id, circleId);

    logger.info('Conflict prediction request', { circleId, userId: req.user.id });

    const prediction = await predictCircleConflicts(circleId);

    return res.status(200).json({
      success: true,
      data: prediction,
    });
  } catch (err) {
    next(err);
  }
}
