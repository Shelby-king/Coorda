const errorHandler = (err, req, res, next) => {
  console.error(`[Error] ${err.message}`, {
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  if (err.type === 'validation') {
    return res.status(400).json({ error: err.message, details: err.details });
  }

  if (err.code === 'auth/id-token-expired' || err.code === 'auth/argument-error') {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  if (err.status) {
    return res.status(err.status).json({ error: err.message });
  }

  res.status(500).json({ error: 'Internal server error' });
};

const createError = (message, status = 500, details = null) => {
  const err = new Error(message);
  err.status = status;
  if (details) err.details = details;
  return err;
};

module.exports = { errorHandler, createError };
