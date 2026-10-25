const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'cricketx_secure_jwt_secret_token_key_2025_99x';

// Mandatory admin authentication
function requireAdmin(req, res, next) {
  const authHeader = req.headers.authorization || req.headers['x-auth-token'];

  if (!authHeader) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No authorization token provided.'
    });
  }

  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : authHeader.trim();

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.admin = decoded;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired authorization token.'
    });
  }
}

// Optional authentication to identify admin if logged in
function checkAuthOptional(req, res, next) {
  const authHeader = req.headers.authorization || req.headers['x-auth-token'];

  if (authHeader) {
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : authHeader.trim();
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.admin = decoded;
    } catch (e) {
      // Ignored for optional check
    }
  }
  next();
}

module.exports = {
  requireAdmin,
  checkAuthOptional,
  JWT_SECRET
};
