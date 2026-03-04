const express = require('express');
const { body, param, query } = require('express-validator');
const { verifyFirebaseToken } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { createError } = require('../middleware/errorHandler');
const {
  getCreditBalance,
  adjustCredits,
  getCreditTransactions,
  getUserById,
} = require('../services/firebaseService');

const router = express.Router();

// Credit pricing tiers (credits → USD)
const CREDIT_PACKAGES = [
  { id: 'starter', credits: 10, priceUsd: 5, label: 'Starter' },
  { id: 'basic', credits: 50, priceUsd: 20, label: 'Basic' },
  { id: 'pro', credits: 100, priceUsd: 35, label: 'Pro' },
  { id: 'enterprise', credits: 500, priceUsd: 150, label: 'Enterprise' },
];

// GET /api/v1/credits/packages — list available credit packages
router.get('/packages', (req, res) => {
  res.json({ packages: CREDIT_PACKAGES });
});

// GET /api/v1/credits/balance
router.get('/balance', verifyFirebaseToken, async (req, res, next) => {
  try {
    const balance = await getCreditBalance(req.user.uid);
    res.json({ userId: req.user.uid, credits: balance });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/credits/purchase
// NOTE: In production this should integrate with a payment processor (Stripe, etc.)
// For now this is a mock endpoint that grants credits after purchase confirmation.
router.post(
  '/purchase',
  verifyFirebaseToken,
  [
    body('packageId')
      .isIn(CREDIT_PACKAGES.map((p) => p.id))
      .withMessage(`packageId must be one of: ${CREDIT_PACKAGES.map((p) => p.id).join(', ')}`),
    body('paymentReference').isString().notEmpty().withMessage('paymentReference required'),
  ],
  validate,
  async (req, res, next) => {
    try {
      const pkg = CREDIT_PACKAGES.find((p) => p.id === req.body.packageId);
      if (!pkg) return next(createError('Invalid credit package', 400));

      const user = await getUserById(req.user.uid);
      if (!user) return next(createError('User not found', 404));

      // TODO: Verify payment with payment processor using paymentReference
      // e.g., await stripe.paymentIntents.retrieve(req.body.paymentReference)

      const newBalance = await adjustCredits(
        req.user.uid,
        pkg.credits,
        'purchase',
        `Purchased ${pkg.credits} credits (${pkg.label} package) — ref: ${req.body.paymentReference}`
      );

      res.json({
        success: true,
        packagePurchased: pkg,
        newBalance,
        paymentReference: req.body.paymentReference,
      });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/v1/credits/use  — manually deduct credits (for custom use cases)
router.post(
  '/use',
  verifyFirebaseToken,
  [
    body('amount').isFloat({ min: 0.5 }).withMessage('amount must be a positive number'),
    body('description').isString().trim().notEmpty().withMessage('description required'),
  ],
  validate,
  async (req, res, next) => {
    try {
      const balance = await getCreditBalance(req.user.uid);
      if (balance < req.body.amount) {
        return next(
          createError(`Insufficient credits. Need ${req.body.amount}, have ${balance}.`, 402)
        );
      }

      const newBalance = await adjustCredits(
        req.user.uid,
        -req.body.amount,
        'manual_deduction',
        req.body.description
      );

      res.json({ success: true, deducted: req.body.amount, newBalance });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/v1/credits/history
router.get(
  '/history',
  verifyFirebaseToken,
  [query('limit').optional().isInt({ min: 1, max: 100 })],
  validate,
  async (req, res, next) => {
    try {
      const transactions = await getCreditTransactions(
        req.user.uid,
        Number(req.query.limit) || 20
      );
      res.json({ data: transactions, count: transactions.length });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
