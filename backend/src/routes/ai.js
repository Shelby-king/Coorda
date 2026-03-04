const express = require('express');
const { body } = require('express-validator');
const { verifyFirebaseToken } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { createError } = require('../middleware/errorHandler');
const { getCreditBalance, adjustCredits } = require('../services/firebaseService');
const { verifySubmission, analyzeRepoWithAI, MODEL_CREDIT_COSTS } = require('../services/aiService');
const { analyzeRepo } = require('../services/githubService');

const router = express.Router();

// POST /api/v1/ai/verify-repo
router.post(
  '/verify-repo',
  verifyFirebaseToken,
  [
    body('repoUrl').isURL().withMessage('Valid repoUrl required'),
    body('requirements').isArray({ min: 1 }).withMessage('requirements array required'),
    body('model')
      .optional()
      .isIn(['gemini', 'claude', 'openai'])
      .withMessage('model must be gemini, claude, or openai'),
    body('hackathonStartDate').optional().isISO8601(),
  ],
  validate,
  async (req, res, next) => {
    try {
      const model = req.body.model || 'gemini';
      const creditCost = MODEL_CREDIT_COSTS[model];

      const balance = await getCreditBalance(req.user.uid);
      if (balance < creditCost) {
        return next(createError(`Insufficient credits. Need ${creditCost}, have ${balance}.`, 402));
      }

      await adjustCredits(
        req.user.uid,
        -creditCost,
        'deduction',
        `AI repo verification (${model}) for ${req.body.repoUrl}`
      );

      const repoAnalysis = await analyzeRepo(req.body.repoUrl, req.body.hackathonStartDate || null);
      const aiResult = await analyzeRepoWithAI(repoAnalysis, req.body.requirements, model);

      res.json({
        repoUrl: req.body.repoUrl,
        model: aiResult.model,
        creditCost: aiResult.creditCost,
        repoAnalysis,
        verification: aiResult.result,
      });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/v1/ai/check-requirements
router.post(
  '/check-requirements',
  verifyFirebaseToken,
  [
    body('description').isString().trim().notEmpty().withMessage('description required'),
    body('requirements').isArray({ min: 1 }).withMessage('requirements array required'),
    body('model').optional().isIn(['gemini', 'claude', 'openai']),
  ],
  validate,
  async (req, res, next) => {
    try {
      const model = req.body.model || 'gemini';
      const creditCost = MODEL_CREDIT_COSTS[model];

      const balance = await getCreditBalance(req.user.uid);
      if (balance < creditCost) {
        return next(createError(`Insufficient credits. Need ${creditCost}, have ${balance}.`, 402));
      }

      await adjustCredits(
        req.user.uid,
        -creditCost,
        'deduction',
        `AI requirements check (${model})`
      );

      const aiResult = await verifySubmission(
        model,
        { description: req.body.description },
        req.body.requirements
      );

      res.json({
        model: aiResult.model,
        creditCost: aiResult.creditCost,
        verification: aiResult.result,
      });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/v1/ai/analyze-submission
router.post(
  '/analyze-submission',
  verifyFirebaseToken,
  [
    body('submissionData').isObject().withMessage('submissionData object required'),
    body('requirements').isArray({ min: 1 }).withMessage('requirements array required'),
    body('model').optional().isIn(['gemini', 'claude', 'openai']),
  ],
  validate,
  async (req, res, next) => {
    try {
      const model = req.body.model || 'gemini';
      const creditCost = MODEL_CREDIT_COSTS[model];

      const balance = await getCreditBalance(req.user.uid);
      if (balance < creditCost) {
        return next(createError(`Insufficient credits. Need ${creditCost}, have ${balance}.`, 402));
      }

      await adjustCredits(
        req.user.uid,
        -creditCost,
        'deduction',
        `AI submission analysis (${model})`
      );

      let submissionData = req.body.submissionData;
      if (submissionData.repoUrl) {
        const repoAnalysis = await analyzeRepo(submissionData.repoUrl).catch(() => null);
        submissionData = { ...submissionData, repoAnalysis };
      }

      const aiResult = await verifySubmission(model, submissionData, req.body.requirements);

      res.json({
        model: aiResult.model,
        creditCost: aiResult.creditCost,
        verification: aiResult.result,
        submissionData,
      });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
