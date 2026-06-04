const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');

/** Attach req.user when a valid Bearer token is present; never rejects. */
async function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return next();
  }

  try {
    const payload = jwt.verify(authHeader.slice(7), process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, name: true, email: true, role: true },
    });
    if (user) req.user = user;
  } catch {
    /* ignore invalid token */
  }
  next();
}

module.exports = optionalAuth;
