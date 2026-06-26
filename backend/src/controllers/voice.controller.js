import { extractVoiceExpense } from '../services/voice.service.js';
import logger from '../utils/logger.js';

/**
 * POST /api/voice/expense
 *
 * Body: { "transcript": "I paid 420 rupees for groceries yesterday" }
 * Returns: Structured expense draft (no DB write)
 */
export async function logVoiceExpense(req, res, next) {
  try {
    const { transcript } = req.body;

    logger.info('Voice expense request received', {
      userId: req.user?.id,
      transcriptLength: transcript.length,
    });

    const draft = await extractVoiceExpense(transcript);

    const warnings = [];
    if (!draft.amount) {
      warnings.push('Amount could not be detected. Please enter it manually.');
    }
    if (!draft.date) {
      warnings.push('Date could not be detected. Defaulting to today.');
    }
    if (draft.confidence !== null && draft.confidence < 0.5) {
      warnings.push('Low confidence extraction. Please review all fields before submitting.');
    }

    return res.status(200).json({
      success: true,
      message: 'Voice transcript processed. Review the draft before creating an expense.',
      data: {
        draft,
        originalTranscript: transcript,
        warnings,
      },
    });
  } catch (err) {
    next(err);
  }
}
