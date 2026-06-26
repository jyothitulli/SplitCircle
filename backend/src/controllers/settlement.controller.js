import * as settlementService from '../services/settlement.service.js';
import { validateCircleIdParam } from '../validators/circle.validator.js';
import { validateSettlementIdParam } from '../validators/settlement.validator.js';

/**
 * GET /api/circles/:circleId/balances
 * Returns balances for all members of the circle.
 */
export async function getBalances(req, res, next) {
  try {
    const circleId = validateCircleIdParam(req.params);
    const balances = await settlementService.getCircleBalances(req.user.id, circleId);

    res.status(200).json({
      success: true,
      data: { balances },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/circles/:circleId/settlements/optimize
 * Optimizes debts, stores them in the DB as PENDING, and returns them.
 */
export async function optimize(req, res, next) {
  try {
    const circleId = validateCircleIdParam(req.params);
    const settlements = await settlementService.optimizeSettlements(req.user.id, circleId);

    res.status(200).json({
      success: true,
      message: 'Settlements optimized successfully',
      data: { settlements },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/settlements/:id/pay
 * Marks a settlement as completed.
 */
export async function pay(req, res, next) {
  try {
    const settlementId = validateSettlementIdParam(req.params);
    const settlement = await settlementService.paySettlement(req.user.id, settlementId);

    res.status(200).json({
      success: true,
      message: 'Settlement marked as completed',
      data: { settlement },
    });
  } catch (error) {
    next(error);
  }
}
