const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const logger = require('./utils/logger');
const authRoutes = require('./routes/auth');

const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || '*';

function createApp() {
  const app = express();

  app.set('trust proxy', 1);

  app.use(helmet());

  app.use(cors({
    origin: ALLOWED_ORIGIN === '*' ? '*' : (origin, cb) => {
      const allowed = ALLOWED_ORIGIN.split(',').map((s) => s.trim());
      if (!origin || allowed.includes(origin)) return cb(null, true);
      cb(new Error(`CORS: ${origin} not allowed`));
    },
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }));

  app.use(morgan('combined', { stream: logger.stream }));
  app.use(express.json());

  app.use('/api/auth', authRoutes);

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
  });

  app.use((err, req, res, _next) => {
    logger.error('Unhandled error', { error: err.message, path: req.path });
    res.status(500).json({ error: 'Internal server error' });
  });

  return app;
}

module.exports = createApp;
