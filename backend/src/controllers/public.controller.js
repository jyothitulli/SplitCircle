import * as publicService from '../services/public.service.js';

export async function getCommunityStats(req, res, next) {
  try {
    const stats = await publicService.getCommunityStats();
    res.status(200).json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
}
