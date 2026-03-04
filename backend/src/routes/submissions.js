const express = require('express');
const multer = require('multer');
const { body, param } = require('express-validator');
const { verifyFirebaseToken } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { createError } = require('../middleware/errorHandler');
const {
  createSubmission,
  getSubmissionById,
  updateSubmission,
  getWaveById,
  getCreditBalance,
  adjustCredits,
} = require('../services/firebaseService');
const { uploadToIPFS, uploadJSONToIPFS } = require('../services/ipfsService');
const { analyzeRepo } = require('../services/githubService');
const { verifySubmission, MODEL_CREDIT_COSTS } = require('../services/aiService');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

// POST /api/v1/submissions  — upload submission with optional file
router.post(
  '/',
  verifyFirebaseToken,
  upload.single('file'),
  [
    body('waveId').isString().notEmpty().withMessage('waveId is required'),
    body('repoUrl').optional().isURL().withMessage('Invalid repository URL'),
    body('description').optional().isString().trim(),
    body('projectName').optional().isString().trim(),
  ],
  validate,
  async (req, res, next) => {
    try {
      const wave = await getWaveById(req.body.waveId);
      if (!wave) return next(createError('Wave not found', 404));
      if (!wave.builders || !wave.builders.includes(req.user.uid)) {
        return next(createError('You must join the wave before submitting', 403));
      }

      let ipfsData = null;

      if (req.file) {
        ipfsData = await uploadToIPFS(req.file.buffer, req.file.originalname);
      }

      const submissionMeta = {
        waveId: req.body.waveId,
        buildathonId: wave.buildathonId,
        devId: req.user.uid,
        repoUrl: req.body.repoUrl || null,
        description: req.body.description || null,
        projectName: req.body.projectName || null,
        ipfsHash: ipfsData?.cid || null,
        ipfsUrl: ipfsData?.url || null,
        fileName: req.file?.originalname || null,
        fileMimeType: req.file?.mimetype || null,
      };

      // Also pin the submission metadata to IPFS
      const metaIpfs = await uploadJSONToIPFS(submissionMeta, 'submission-meta.json').catch(() => null);
      if (metaIpfs) submissionMeta.metadataCid = metaIpfs.cid;

      const submission = await createSubmission(submissionMeta);
      res.status(201).json(submission);
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/v1/submissions/:id
router.get(
  '/:id',
  verifyFirebaseToken,
  [param('id').isString().notEmpty()],
  validate,
  async (req, res, next) => {
    try {
      const submission = await getSubmissionById(req.params.id);
      if (!submission) return next(createError('Submission not found', 404));
      res.json(submission);
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/v1/submissions/:id/verify  — trigger AI verification
router.post(
  '/:id/verify',
  verifyFirebaseToken,
  [
    param('id').isString().notEmpty(),
    body('model')
      .optional()
      .isIn(['gemini', 'claude', 'openai'])
      .withMessage('model must be gemini, claude, or openai'),
  ],
  validate,
  async (req, res, next) => {
    try {
      const submission = await getSubmissionById(req.params.id);
      if (!submission) return next(createError('Submission not found', 404));

      const wave = await getWaveById(submission.waveId);
      if (!wave) return next(createError('Associated wave not found', 404));

      const model = req.body.model || 'gemini';
      const creditCost = MODEL_CREDIT_COSTS[model];

      // Credit check — deduct from the caller (host or developer)
      const balance = await getCreditBalance(req.user.uid);
      if (balance < creditCost) {
        return next(
          createError(
            `Insufficient credits. Need ${creditCost}, have ${balance}. Purchase more credits.`,
            402
          )
        );
      }

      // Deduct credits
      await adjustCredits(
        req.user.uid,
        -creditCost,
        'deduction',
        `AI verification (${model}) for submission ${submission.id}`
      );

      // Run GitHub analysis if repo URL exists
      let repoAnalysis = null;
      if (submission.repoUrl) {
        repoAnalysis = await analyzeRepo(submission.repoUrl).catch((e) => ({ error: e.message }));
      }

      // Run AI verification
      const aiResult = await verifySubmission(model, { ...submission, repoAnalysis }, wave.requirements || []);

      // Persist result
      const updated = await updateSubmission(submission.id, {
        verificationStatus: 'verified',
        verificationScore: aiResult.result.score,
        verificationResult: aiResult.result,
        verificationModel: aiResult.model,
        verificationCreditCost: aiResult.creditCost,
        verifiedAt: new Date().toISOString(),
        repoAnalysis,
      });

      res.json(updated);
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
