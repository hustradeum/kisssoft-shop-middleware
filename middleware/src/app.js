const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const { loginHandler, verifyHandler } = require('./routes/auth');

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

  app.use(morgan('combined'));
  app.use(express.json());

  app.post('/api/auth/login', loginHandler);
  app.get('/api/auth/verify', verifyHandler);

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.use((_req, res) => res.status(404).json({ error: 'not_found' }));

  app.use((err, req, res, _next) => {
    console.error(`[ERROR] ${new Date().toISOString()} ${req.path} ${err.message}`);
    res.status(500).json({ error: 'internal_error' });
  });

  return app;
}

module.exports = createApp;
