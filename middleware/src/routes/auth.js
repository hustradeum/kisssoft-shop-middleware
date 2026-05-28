const express = require('express');
const jwt = require('jsonwebtoken');
const { authenticateUser } = require('../services/kisssoft');
const { isBlocked } = require('../services/geo');
const logger = require('../utils/logger');

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '8h';

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required.' });
  }

  try {
    const result = await authenticateUser(email, password);

    if (result.status !== 'approved') {
      logger.info('KISSsoft auth denied', { email });
      return res.status(401).json({
        success: false,
        message: 'Access denied. Invalid credentials or account not approved.',
      });
    }

    const user = result.user || {};
    const country = user.country || '';
    const state = user.state || '';

    if (isBlocked(country, state)) {
      logger.info('Access blocked by geo restriction', { email, country, state });
      return res.status(403).json({
        success: false,
        message: 'Access to the KISSsoft shop is not available in your region.',
      });
    }

    const token = jwt.sign(
      { email, country, company: user.company || '' },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    logger.info('Login successful', { email, country });
    return res.json({ success: true, token });

  } catch (err) {
    logger.error('KISSsoft API error', { email, error: err.message });
    // Always return 200 so Cloudflare doesn't strip CORS headers from 5xx responses.
    return res.status(200).json({
      success: false,
      message: 'Authentication service temporarily unavailable. Please try again later.',
    });
  }
});

// GET /api/auth/verify
router.get('/verify', (req, res) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ valid: false });
  }

  const token = authHeader.slice(7);

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return res.json({ valid: true, email: decoded.email, country: decoded.country });
  } catch {
    return res.status(401).json({ valid: false });
  }
});

module.exports = router;
