const express = require('express');
const { body, param } = require('express-validator');
const { verifyFirebaseToken } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { createError } = require('../middleware/errorHandler');
const { getDb, admin } = require('../config/firebase');
const { getTransactionResult, waitForTransaction } = require('../services/flowService');

const ESCROW_COLLECTION = 'escrows';

const router = express.Router();

// POST /api/v1/escrow/create
router.post(
  '/create',
  verifyFirebaseToken,
  [
    body('buildathonId').isString().notEmpty(),
    body('amount').isNumeric().withMessage('amount must be a number'),
    body('currency').optional().isString(),
    body('flowTxId').optional().isString(),
  ],
  validate,
  async (req, res, next) => {
    try {
      const db = getDb();
      const ref = db.collection(ESCROW_COLLECTION).doc();
      const escrow = {
        id: ref.id,
        buildathonId: req.body.buildathonId,
        hostId: req.user.uid,
        amount: req.body.amount,
        currency: req.body.currency || 'FLOW',
        status: 'pending',
        flowTxId: req.body.flowTxId || null,
        flowEscrowId: null,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };
      await ref.set(escrow);
      res.status(201).json(escrow);
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/v1/escrow/lock
router.post(
  '/lock',
  verifyFirebaseToken,
  [
    body('escrowId').isString().notEmpty(),
    body('flowTxId').isString().notEmpty().withMessage('flowTxId (Flow transaction ID) required'),
  ],
  validate,
  async (req, res, next) => {
    try {
      const db = getDb();
      const docRef = db.collection(ESCROW_COLLECTION).doc(req.body.escrowId);
      const doc = await docRef.get();
      if (!doc.exists) return next(createError('Escrow record not found', 404));

      const escrow = doc.data();
      if (escrow.hostId !== req.user.uid) return next(createError('Forbidden', 403));
      if (escrow.status === 'locked') return next(createError('Escrow already locked', 409));

      // Verify the Flow transaction sealed
      let txResult = null;
      try {
        txResult = await waitForTransaction(req.body.flowTxId, 20000);
      } catch (e) {
        return next(createError(`Flow transaction verification failed: ${e.message}`, 400));
      }

      await docRef.update({
        status: 'locked',
        flowTxId: req.body.flowTxId,
        flowTxResult: txResult,
        lockedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      const updated = await docRef.get();
      res.json({ id: updated.id, ...updated.data() });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/v1/escrow/release
router.post(
  '/release',
  verifyFirebaseToken,
  [
    body('escrowId').isString().notEmpty(),
    body('recipientId').isString().notEmpty(),
    body('flowTxId').isString().notEmpty(),
  ],
  validate,
  async (req, res, next) => {
    try {
      const db = getDb();
      const docRef = db.collection(ESCROW_COLLECTION).doc(req.body.escrowId);
      const doc = await docRef.get();
      if (!doc.exists) return next(createError('Escrow record not found', 404));

      const escrow = doc.data();
      if (escrow.hostId !== req.user.uid) return next(createError('Forbidden', 403));
      if (escrow.status !== 'locked') return next(createError('Escrow must be locked before release', 400));

      let txResult = null;
      try {
        txResult = await waitForTransaction(req.body.flowTxId, 20000);
      } catch (e) {
        return next(createError(`Flow transaction verification failed: ${e.message}`, 400));
      }

      await docRef.update({
        status: 'released',
        recipientId: req.body.recipientId,
        releaseTxId: req.body.flowTxId,
        releaseTxResult: txResult,
        releasedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      const updated = await docRef.get();
      res.json({ id: updated.id, ...updated.data() });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/v1/escrow/dispute
router.post(
  '/dispute',
  verifyFirebaseToken,
  [
    body('escrowId').isString().notEmpty(),
    body('reason').isString().trim().notEmpty().withMessage('Dispute reason required'),
  ],
  validate,
  async (req, res, next) => {
    try {
      const db = getDb();
      const docRef = db.collection(ESCROW_COLLECTION).doc(req.body.escrowId);
      const doc = await docRef.get();
      if (!doc.exists) return next(createError('Escrow record not found', 404));

      const escrow = doc.data();
      if (escrow.status !== 'locked') {
        return next(createError('Can only dispute locked escrows', 400));
      }
      if (escrow.hostId !== req.user.uid && escrow.recipientId !== req.user.uid) {
        return next(createError('Only involved parties can raise a dispute', 403));
      }

      await docRef.update({
        status: 'disputed',
        disputeRaisedBy: req.user.uid,
        disputeReason: req.body.reason,
        disputedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      const updated = await docRef.get();
      res.json({ id: updated.id, ...updated.data() });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/v1/escrow/status/:id
router.get(
  '/status/:id',
  verifyFirebaseToken,
  [param('id').isString().notEmpty()],
  validate,
  async (req, res, next) => {
    try {
      const db = getDb();
      const doc = await db.collection(ESCROW_COLLECTION).doc(req.params.id).get();
      if (!doc.exists) return next(createError('Escrow record not found', 404));
      res.json({ id: doc.id, ...doc.data() });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
