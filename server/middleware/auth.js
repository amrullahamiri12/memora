const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');
const { isStaff } = require('../lib/roles');
const { isLearnerViewRequest } = require('../lib/learnerView');

async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const token = authHeader.slice(7);

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, name: true, email: true, role: true, deactivatedAt: true },
    });

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    if (user.deactivatedAt) {
      return res.status(403).json({
        error: 'This account has been closed',
        code: 'ACCOUNT_DEACTIVATED',
      });
    }

    req.user = user;
    req.learnerView = isStaff(user.role) && isLearnerViewRequest(req.headers);
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

module.exports = authMiddleware;
