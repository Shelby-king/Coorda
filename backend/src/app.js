const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const userRoutes = require('./routes/users');
const buildathonRoutes = require('./routes/buildathons');
const waveRoutes = require('./routes/waves');
const submissionRoutes = require('./routes/submissions');
const escrowRoutes = require('./routes/escrow');
const aiRoutes = require('./routes/ai');
const creditRoutes = require('./routes/credits');

const { errorHandler } = require('./middleware/errorHandler');

const app = express();

app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});
app.use(globalLimiter);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/v1/users', userRoutes);
app.use('/api/v1/buildathons', buildathonRoutes);
app.use('/api/v1/waves', waveRoutes);
app.use('/api/v1/submissions', submissionRoutes);
app.use('/api/v1/escrow', escrowRoutes);
app.use('/api/v1/ai', aiRoutes);
app.use('/api/v1/credits', creditRoutes);

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.use(errorHandler);

module.exports = app;
