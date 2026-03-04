const express = require('express');
const { body, param } = require('express-validator');
const { verifyFirebaseToken, optionalAuth } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { createError } = require('../middleware/errorHandler');
const {
  createWave,
  getWaveById,
  joinWave,
  updateWave,
  getBuildathonById,
  getSubmissionsByWave,
  getUserById,
} = require('../services/firebaseService');

const router = express.Router();

// POST /api/v1/waves
router.post(
  '/',
  verifyFirebaseToken,
  [
    body('buildathonId').isString().notEmpty().withMessage('buildathonId required'),
    body('name').isString().trim().notEmpty().withMessage('Wave name required'),
    body('description').optional().isString().trim(),
    body('maxBuilders').isInt({ min: 1 }).withMessage('maxBuilders must be a positive integer'),
    body('requirements').optional().isArray(),
    body('prizeAmount').optional().isNumeric(),
    body('deadline').optional().isISO8601(),
  ],
  validate,
  async (req, res, next) => {
    try {
      const buildathon = await getBuildathonById(req.body.buildathonId);
      if (!buildathon) return next(createError('Buildathon not found', 404));
      if (buildathon.hostId !== req.user.uid) {
        return next(createError('Only the host can create waves', 403));
      }
      const wave = await createWave({ ...req.body, hostId: req.user.uid });
      res.status(201).json(wave);
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/v1/waves/:id
router.get(
  '/:id',
  optionalAuth,
  [param('id').isString().notEmpty()],
  validate,
  async (req, res, next) => {
    try {
      const wave = await getWaveById(req.params.id);
      if (!wave) return next(createError('Wave not found', 404));
      res.json(wave);
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/v1/waves/:id/join
router.post(
  '/:id/join',
  verifyFirebaseToken,
  [param('id').isString().notEmpty()],
  validate,
  async (req, res, next) => {
    try {
      const wave = await getWaveById(req.params.id);
      if (!wave) return next(createError('Wave not found', 404));
      if (wave.status !== 'open') return next(createError('Wave is not open for joining', 400));

      if (wave.builders && wave.builders.includes(req.user.uid)) {
        return next(createError('Already joined this wave', 409));
      }

      if (wave.builders && wave.builders.length >= wave.maxBuilders) {
        return next(createError('Wave is at full capacity', 400));
      }

      const updated = await joinWave(req.params.id, req.user.uid);
      res.json(updated);
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/v1/waves/:id/builders
router.get(
  '/:id/builders',
  verifyFirebaseToken,
  [param('id').isString().notEmpty()],
  validate,
  async (req, res, next) => {
    try {
      const wave = await getWaveById(req.params.id);
      if (!wave) return next(createError('Wave not found', 404));

      const builderProfiles = await Promise.allSettled(
        (wave.builders || []).map((uid) => getUserById(uid))
      );
      const builders = builderProfiles
        .filter((r) => r.status === 'fulfilled' && r.value)
        .map(({ value: { uid, displayName, email, flowAddress } }) => ({
          uid, displayName, email, flowAddress,
        }));

      res.json({ waveId: wave.id, count: builders.length, builders });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/v1/waves/:id/submissions
router.get(
  '/:id/submissions',
  verifyFirebaseToken,
  [param('id').isString().notEmpty()],
  validate,
  async (req, res, next) => {
    try {
      const wave = await getWaveById(req.params.id);
      if (!wave) return next(createError('Wave not found', 404));
      const submissions = await getSubmissionsByWave(req.params.id);
      res.json({ data: submissions, count: submissions.length });
    } catch (err) {
      next(err);
    }
  }
);

// PUT /api/v1/waves/:id
router.put(
  '/:id',
  verifyFirebaseToken,
  [
    param('id').isString().notEmpty(),
    body('name').optional().isString().trim(),
    body('description').optional().isString().trim(),
    body('status').optional().isIn(['open', 'closed', 'completed']),
    body('maxBuilders').optional().isInt({ min: 1 }),
    body('requirements').optional().isArray(),
    body('deadline').optional().isISO8601(),
  ],
  validate,
  async (req, res, next) => {
    try {
      const wave = await getWaveById(req.params.id);
      if (!wave) return next(createError('Wave not found', 404));
      if (wave.hostId !== req.user.uid) {
        return next(createError('Only the host can update this wave', 403));
      }
      const { id, buildathonId, hostId, builders, createdAt, ...allowedFields } = req.body;
      const updated = await updateWave(req.params.id, allowedFields);
      res.json(updated);
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
