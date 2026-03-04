const { getDb, admin } = require('../config/firebase');

// ─── Collections ──────────────────────────────────────────────
const COLLECTIONS = {
  USERS: 'users',
  BUILDATHONS: 'buildathons',
  WAVES: 'waves',
  SUBMISSIONS: 'submissions',
  CREDITS: 'credits',
  CREDIT_TRANSACTIONS: 'credit_transactions',
};

// ─── Users ────────────────────────────────────────────────────
const createUser = async (uid, data) => {
  const db = getDb();
  const userDoc = {
    uid,
    email: data.email,
    displayName: data.displayName || '',
    role: data.role || 'developer',
    credits: 0,
    flowAddress: data.flowAddress || null,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };
  await db.collection(COLLECTIONS.USERS).doc(uid).set(userDoc);
  return userDoc;
};

const getUserById = async (uid) => {
  const db = getDb();
  const doc = await db.collection(COLLECTIONS.USERS).doc(uid).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() };
};

const updateUser = async (uid, data) => {
  const db = getDb();
  const updateData = { ...data, updatedAt: admin.firestore.FieldValue.serverTimestamp() };
  await db.collection(COLLECTIONS.USERS).doc(uid).update(updateData);
  return getUserById(uid);
};

// ─── Buildathons ──────────────────────────────────────────────
const createBuildathon = async (data) => {
  const db = getDb();
  const ref = db.collection(COLLECTIONS.BUILDATHONS).doc();
  const buildathon = {
    ...data,
    id: ref.id,
    status: 'draft',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };
  await ref.set(buildathon);
  return buildathon;
};

const getBuildathonById = async (id) => {
  const db = getDb();
  const doc = await db.collection(COLLECTIONS.BUILDATHONS).doc(id).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() };
};

const getBuildathons = async ({ status, hostId, limit = 20, offset = 0 } = {}) => {
  const db = getDb();
  let query = db.collection(COLLECTIONS.BUILDATHONS).orderBy('createdAt', 'desc');
  if (status) query = query.where('status', '==', status);
  if (hostId) query = query.where('hostId', '==', hostId);
  query = query.limit(limit).offset(offset);
  const snapshot = await query.get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

const updateBuildathon = async (id, data) => {
  const db = getDb();
  const updateData = { ...data, updatedAt: admin.firestore.FieldValue.serverTimestamp() };
  await db.collection(COLLECTIONS.BUILDATHONS).doc(id).update(updateData);
  return getBuildathonById(id);
};

// ─── Waves ────────────────────────────────────────────────────
const createWave = async (data) => {
  const db = getDb();
  const ref = db.collection(COLLECTIONS.WAVES).doc();
  const wave = {
    ...data,
    id: ref.id,
    builders: [],
    status: 'open',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };
  await ref.set(wave);
  return wave;
};

const getWaveById = async (id) => {
  const db = getDb();
  const doc = await db.collection(COLLECTIONS.WAVES).doc(id).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() };
};

const getWavesByBuildathon = async (buildathonId) => {
  const db = getDb();
  const snapshot = await db
    .collection(COLLECTIONS.WAVES)
    .where('buildathonId', '==', buildathonId)
    .get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

const joinWave = async (waveId, userId) => {
  const db = getDb();
  await db.collection(COLLECTIONS.WAVES).doc(waveId).update({
    builders: admin.firestore.FieldValue.arrayUnion(userId),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  return getWaveById(waveId);
};

const updateWave = async (id, data) => {
  const db = getDb();
  const updateData = { ...data, updatedAt: admin.firestore.FieldValue.serverTimestamp() };
  await db.collection(COLLECTIONS.WAVES).doc(id).update(updateData);
  return getWaveById(id);
};

// ─── Submissions ──────────────────────────────────────────────
const createSubmission = async (data) => {
  const db = getDb();
  const ref = db.collection(COLLECTIONS.SUBMISSIONS).doc();
  const submission = {
    ...data,
    id: ref.id,
    status: 'pending',
    verificationStatus: 'unverified',
    verificationScore: null,
    verificationResult: null,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };
  await ref.set(submission);
  return submission;
};

const getSubmissionById = async (id) => {
  const db = getDb();
  const doc = await db.collection(COLLECTIONS.SUBMISSIONS).doc(id).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() };
};

const getSubmissionsByWave = async (waveId) => {
  const db = getDb();
  const snapshot = await db
    .collection(COLLECTIONS.SUBMISSIONS)
    .where('waveId', '==', waveId)
    .get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

const updateSubmission = async (id, data) => {
  const db = getDb();
  const updateData = { ...data, updatedAt: admin.firestore.FieldValue.serverTimestamp() };
  await db.collection(COLLECTIONS.SUBMISSIONS).doc(id).update(updateData);
  return getSubmissionById(id);
};

// ─── Credits ──────────────────────────────────────────────────
const getCreditBalance = async (userId) => {
  const doc = await getUserById(userId);
  return doc ? doc.credits || 0 : 0;
};

const adjustCredits = async (userId, amount, type, description) => {
  const db = getDb();
  const batch = db.batch();

  const userRef = db.collection(COLLECTIONS.USERS).doc(userId);
  batch.update(userRef, {
    credits: admin.firestore.FieldValue.increment(amount),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  const txRef = db.collection(COLLECTIONS.CREDIT_TRANSACTIONS).doc();
  batch.set(txRef, {
    id: txRef.id,
    userId,
    amount,
    type,
    description,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  await batch.commit();
  return getCreditBalance(userId);
};

const getCreditTransactions = async (userId, limit = 20) => {
  const db = getDb();
  const snapshot = await db
    .collection(COLLECTIONS.CREDIT_TRANSACTIONS)
    .where('userId', '==', userId)
    .orderBy('createdAt', 'desc')
    .limit(limit)
    .get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

module.exports = {
  COLLECTIONS,
  createUser,
  getUserById,
  updateUser,
  createBuildathon,
  getBuildathonById,
  getBuildathons,
  updateBuildathon,
  createWave,
  getWaveById,
  getWavesByBuildathon,
  joinWave,
  updateWave,
  createSubmission,
  getSubmissionById,
  getSubmissionsByWave,
  updateSubmission,
  getCreditBalance,
  adjustCredits,
  getCreditTransactions,
};
