const jwt = require('../utils/jwt');

const SECRET = process.env.JWT_SECRET || 'change-this-in-production-aadynamic-2026';

/**
 * requireAuth(...roles) - Express middleware factory.
 * Reads "Authorization: Bearer <token>", verifies it, and checks the role
 * is one of the allowed roles. Attaches { userId, role, name } to req.user.
 */
function requireAuth(...roles) {
  return (req, res, next) => {
    const header = req.headers.authorization || '';
    // Support both the normal "Authorization: Bearer <token>" header (used by
    // axios for all JSON requests) and a "?token=" query param, needed for
    // plain <a>/window.open() file downloads which can't set custom headers.
    const token = header.startsWith('Bearer ') ? header.slice(7) : (req.query.token || null);
    if (!token) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    try {
      const payload = jwt.verify(token, SECRET);
      if (roles.length && !roles.includes(payload.role)) {
        return res.status(403).json({ error: 'Not authorized for this resource' });
      }
      req.user = payload;
      next();
    } catch (e) {
      return res.status(401).json({ error: 'Invalid or expired session' });
    }
  };
}

function signToken(payload) {
  return jwt.sign(payload, SECRET, 60 * 60 * 24 * 7); // 7 days
}

module.exports = { requireAuth, signToken, SECRET };
