const { verifyAccessToken } = require('../utils/jwt.util');
const { UserAccount } = require('../models/auth/user-account.model');

const SESSION_ENDED = 'Your session has ended. Please sign in again.';

// Checks the bearer token and that its login is still active (not disabled, password not changed since).
const authMiddleware = async (req, res, next) => {
  const authorization = req.headers.authorization;
  const [scheme, token] = authorization ? authorization.split(' ') : [];

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({
      success: false,
      message: 'Access token is required.'
    });
  }

  let payload;
  try {
    payload = verifyAccessToken(token);
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: error.message
    });
  }

  try {
    const account = payload.aid
      ? await UserAccount.findById(payload.aid).select('status tokenVersion role').lean()
      : null;
    if (!account || account.status !== 'Active' || account.tokenVersion !== payload.v || account.role !== payload.role) {
      return res.status(401).json({ success: false, message: SESSION_ENDED });
    }
  } catch (error) {
    return next(error);
  }

  req.user = { id: payload.id, role: payload.role, accountId: payload.aid };
  return next();
};

const requireRole = (...allowedRoles) => (req, res, next) => {
  if (!req.user || !allowedRoles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: 'You do not have permission to access this resource.'
    });
  }

  return next();
};

// Roles that run day-to-day operations (super admin + transport managers).
const STAFF_ROLES = ['admin', 'manager'];

// Drivers may only list their own records: force the driverId filter to the signed-in driver.
const scopeToSignedInDriver = (req, res, next) => {
  if (req.user?.role === 'driver') {
    req.validatedQuery = { ...(req.validatedQuery || {}), driverId: String(req.user.id) };
  }
  return next();
};

module.exports = { verifyAccessToken: authMiddleware, requireRole, STAFF_ROLES, scopeToSignedInDriver };
