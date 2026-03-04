const express = require('express');
const { body, param, query } = require('express-validator');
const { verifyFirebaseToken, optionalAuth } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { createError } = require('../middleware/errorHandler');
const {
  createBuildathon,
  getBuildathonById,
  getBuildathons,
  updateBuildathon,
  getWavesByBuildathon,
} = require('../services/firebaseService');

const router = express.Router();

// POST /api/v1/buildathons
router.post(
  '/',
  verifyFirebaseToken,
  [
    body('title').isString().trim().notEmpty().withMessage('Title is required'),
    body('description').isString().trim().notEmpty(),
    body('prizePool').isNumeric().withMessage('Prize pool must be a number'),
    body('currency').optional().isString().trim(),
    body('startDate').isISO8601().withMessage('Valid startDate required'),
    body('endDate').isISO8601().withMessage('Valid endDate required'),
    body('requirements').optional().isArray(),
    body('maxWaves').optional().isInt({ min: 1 }),
  ],
  validate,
  async (req, res, next) => {
    try {
      const buildathon = await createBuildathon({
        ...req.body,
        hostId: req.user.uid,
      });
      res.status(201).json(buildathon);
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/v1/buildathons
router.get(
  '/',
  optionalAuth,
  [
    query('status').optional().isIn(['draft', 'active', 'completed', 'cancelled']),
    query('hostId').optional().isString(),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('offset').optional().isInt({ min: 0 }),
  ],
  validate,
  async (req, res, next) => {
    try {
      const buildathons = await getBuildathons({
        status: req.query.status,
        hostId: req.query.hostId,
        limit: Number(req.query.limit) || 20,
        offset: Number(req.query.offset) || 0,
      });
      res.json({ data: buildathons, count: buildathons.length });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/v1/buildathons/:id
router.get(
  '/:id',
  optionalAuth,
  [param('id').isString().notEmpty()],
  validate,
  async (req, res, next) => {
    try {
      const buildathon = await getBuildathonById(req.params.id);
      if (!buildathon) return next(createError('Buildathon not found', 404));
      res.json(buildathon);
    } catch (err) {
      next(err);
    }
  }
);

// PUT /api/v1/buildathons/:id
router.put(
  '/:id',
  verifyFirebaseToken,
  [
    param('id').isString().notEmpty(),
    body('title').optional().isString().trim(),
    body('description').optional().isString().trim(),
    body('status').optional().isIn(['draft', 'active', 'completed', 'cancelled']),
    body('prizePool').optional().isNumeric(),
    body('requirements').optional().isArray(),
  ],
  validate,
  async (req, res, next) => {
    try {
      const buildathon = await getBuildathonById(req.params.id);
      if (!buildathon) return next(createError('Buildathon not found', 404));
      if (buildathon.hostId !== req.user.uid) {
        return next(createError('Forbidden: only the host can update this buildathon', 403));
      }
      const { id, hostId, createdAt, ...allowedFields } = req.body;
      const updated = await updateBuildathon(req.params.id, allowedFields);
      res.json(updated);
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/v1/buildathons/:id/waves
router.get(
  '/:id/waves',
  optionalAuth,
  [param('id').isString().notEmpty()],
  validate,
  async (req, res, next) => {
    try {
      const buildathon = await getBuildathonById(req.params.id);
      if (!buildathon) return next(createError('Buildathon not found', 404));
      const waves = await getWavesByBuildathon(req.params.id);
      res.json({ data: waves, count: waves.length });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
