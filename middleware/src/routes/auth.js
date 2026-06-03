const jwt = require('jsonwebtoken');
const { authenticateUser } = require('../services/kisssoft');
const { isGeoBlocked } = require('../services/geo');

const JWT_EXPIRES_IN = '12h';

async function loginHandler(req, res) {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ success: false, code: 'missing_credentials' });
  }

  // Pre-check: Cloudflare geo headers (before hitting KISSsoft API)
  const cfCountry = req.headers['cf-ipcountry'] || '';
  const cfRegion = req.headers['cf-region-code'] || '';
  if (cfCountry && isGeoBlocked(cfCountry, cfRegion)) {
    return res.status(403).json({ success: false, code: 'geo_blocked' });
  }

  let result;
  try {
    result = await authenticateUser(email, password);
  } catch (err) {
    console.error(`[UPSTREAM] ${new Date().toISOString()} email=${email} error=${err.message}`);
    return res.status(502).json({ success: false, code: 'upstream_unreachable' });
  }

  if (result.status === 'restricted') {
    return res.status(403).json({ success: false, code: 'geo_blocked' });
  }

  if (result.status !== 'approved') {
    return res.status(401).json({ success: false, code: 'denied' });
  }

  const user = result.user || {};

  // Post-login geo check on KISSsoft user data (if available)
  if (user.country && isGeoBlocked(user.country, user.state || '')) {
    return res.status(403).json({ success: false, code: 'geo_blocked' });
  }

  const token = jwt.sign(
    {
      email,
      country: user.country || cfCountry || '',
      company: user.company || '',
      _upstream500: result._upstream500 || false,
    },
    process.env.JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

  return res.json({ success: true, token });
}

function verifyHandler(req, res) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ valid: false });
  }

  const token = authHeader.slice(7);
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return res.json({ valid: true, email: decoded.email, country: decoded.country });
  } catch {
    return res.status(401).json({ valid: false });
  }
}

module.exports = { loginHandler, verifyHandler };
