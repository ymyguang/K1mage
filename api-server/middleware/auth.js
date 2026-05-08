import { findUserById, verifyUserToken } from '../services/auth-service.js';

export async function getUserFromRequest(req) {
  const header = req.get('Authorization') || '';
  const match = header.match(/^Bearer\s+(.+)$/i);

  if (!match) {
    const error = new Error('Authorization token is required');
    error.statusCode = 401;
    throw error;
  }

  const payload = verifyUserToken(match[1]);
  const user = await findUserById(payload.sub);

  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 401;
    throw error;
  }

  if (user.status !== 'active') {
    const error = new Error('User is disabled');
    error.statusCode = 403;
    throw error;
  }

  return user;
}

export async function requireAuth(req, res, next) {
  try {
    req.user = await getUserFromRequest(req);
    next();
  } catch (error) {
    return res.status(error.statusCode || 401).json({
      success: false,
      error: error.message || 'Invalid authorization token'
    });
  }
}

export function requireAdmin(req, res, next) {
  if (!req.user || !['admin', 'super_admin'].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      error: 'Admin permission is required'
    });
  }

  next();
}
