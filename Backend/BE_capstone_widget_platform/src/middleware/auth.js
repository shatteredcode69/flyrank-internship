// src/middleware/auth.js
const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET || 'dev-secret-do-not-use-in-prod';
const EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

function signToken(user) {
  return jwt.sign({ sub: user.id, email: user.email }, SECRET, { expiresIn: EXPIRES_IN });
}

// Protects the owner-facing API (widget management + dashboard). Public
// widget delivery and submission endpoints never use this — that surface
// has to work for visitors who have no account at all.
function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'unauthorized', message: 'Missing or malformed Authorization header' });
  }

  try {
    const payload = jwt.verify(token, SECRET);
    req.user = { id: payload.sub, email: payload.email };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'unauthorized', message: 'Invalid or expired token' });
  }
}

module.exports = { signToken, requireAuth, SECRET };
