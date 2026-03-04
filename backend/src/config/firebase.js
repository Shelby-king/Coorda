const admin = require('firebase-admin');

let db;

const initFirebase = () => {
  if (admin.apps.length === 0) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      }),
      databaseURL: process.env.FIREBASE_DATABASE_URL,
    });
  }
  db = admin.firestore();
  return db;
};

const getDb = () => {
  if (!db) {
    return initFirebase();
  }
  return db;
};

const getAuth = () => admin.auth();

module.exports = { initFirebase, getDb, getAuth, admin };
