const express = require('express');
const { body, param } = require('express-validator');
const { verifyFirebaseToken } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { createError } = require('../middleware/errorHandler');
const {
  getUserById,
  createUser,
  updateUser,
  getCreditBalance,
} = require('../services/firebaseService');

const router = express.Router();

// POST /api/v1/users  — create/register user profile after Firebase auth
router.post(
  '/',
  verifyFirebaseToken,
  [
    body('email').isEmail().withMessage('Valid email required'),
    body('role').isIn(['host', 'developer']).withMessage('Role must be host or developer'),
    body('displayName').optional().isString().trim(),
    body('flowAddress').optional().isString().trim(),
  ],
  validate,
  async (req, res, next) => {
    try {
      const existing = await getUserById(req.user.uid);
      if (existing) return res.status(200).json(existing);

      const user = await createUser(req.user.uid, {
        email: req.body.email,
        role: req.body.role,
        displayName: req.body.displayName,
        flowAddress: req.body.flowAddress,
      });
      res.status(201).json(user);
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/v1/users/:id
router.get(
  '/:id',
  verifyFirebaseToken,
  [param('id').isString().notEmpty()],
  validate,
  async (req, res, next) => {
    try {
      const user = await getUserById(req.params.id);
      if (!user) return next(createError('User not found', 404));

      // Only return sensitive data to the user themselves
      if (req.user.uid !== req.params.id) {
        const { credits, ...publicData } = user;
        return res.json(publicData);
      }
      res.json(user);
    } catch (err) {
      next(err);
    }
  }
);

// PUT /api/v1/users/:id
router.put(
  '/:id',
  verifyFirebaseToken,
  [
    param('id').isString().notEmpty(),
    body('displayName').optional().isString().trim(),
    body('flowAddress').optional().isString().trim(),
    body('role').optional().isIn(['host', 'developer']),
  ],
  validate,
  async (req, res, next) => {
    try {
      if (req.user.uid !== req.params.id) {
        return next(createError('Forbidden: cannot update another user', 403));
      }
      const { uid, credits, createdAt, ...allowedFields } = req.body;
      const updated = await updateUser(req.params.id, allowedFields);
      res.json(updated);
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/v1/users/:id/balance
router.get(
  '/:id/balance',
  verifyFirebaseToken,
  [param('id').isString().notEmpty()],
  validate,
  async (req, res, next) => {
    try {
      if (req.user.uid !== req.params.id) {
        return next(createError('Forbidden', 403));
      }
      const balance = await getCreditBalance(req.params.id);
      res.json({ userId: req.params.id, credits: balance });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
