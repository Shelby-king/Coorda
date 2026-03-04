const { getAuth } = require('../config/firebase');
const { createError } = require('./errorHandler');

const verifyFirebaseToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(createError('Missing or invalid Authorization header', 401));
    }

    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await getAuth().verifyIdToken(idToken);
    req.user = decodedToken;
    next();
  } catch (err) {
    next(err);
  }
};

const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) {
    return next(createError('Unauthorized', 401));
  }
  if (roles.length > 0 && !roles.includes(req.user.role)) {
    return next(createError('Insufficient permissions', 403));
  }
  next();
};

const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const idToken = authHeader.split('Bearer ')[1];
      req.user = await getAuth().verifyIdToken(idToken);
    }
    next();
  } catch {
    next();
  }
};

module.exports = { verifyFirebaseToken, requireRole, optionalAuth };
