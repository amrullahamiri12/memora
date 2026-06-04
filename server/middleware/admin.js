const { isStaff } = require('../lib/roles');

function adminMiddleware(req, res, next) {
  if (!isStaff(req.user?.role)) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

module.exports = adminMiddleware;
