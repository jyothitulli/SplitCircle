import { getCircleInsights } from '../services/insights.service.js';
import { requireCircleMembership } from '../utils/membership.js';
import logger from '../utils/logger.js';

/**
 * GET /api/circles/:circleId/insights
 *
 * Returns 3–10 AI-generated natural-language insights for a circle.
 * Requires the requesting user to be a member of the circle.
 *
 * Query params:
 *   refresh=true  → bypass the 5-minute cache and re-generate
 */
export async function getInsights(req, res, next) {
  try {
    const { circleId } = req.params;
    const forceRefresh = req.query.refresh === 'true';

    // Must be a member
    await requireCircleMembership(req.user.id, circleId);

    logger.info('Generating insights', { circleId, userId: req.user.id, forceRefresh });

    const result = await getCircleInsights(circleId, { forceRefresh });

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
}
