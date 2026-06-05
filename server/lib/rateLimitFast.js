/** In-memory rate limits for Vercel fast paths (per warm instance). */

const stores = new Map();

function clientIp(req) {
  const forwarded = req.headers['x-forwarded-for'] || req.headers['X-Forwarded-For'];
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0].trim();
  }
  return req.socket?.remoteAddress || 'unknown';
}

function check(key, { windowMs, max }) {
  const now = Date.now();
  let entry = stores.get(key);
  if (!entry || now >= entry.resetAt) {
    entry = { count: 0, resetAt: now + windowMs };
    stores.set(key, entry);
  }
  entry.count += 1;
  if (entry.count > max) {
    return {
      allowed: false,
      body: { error: 'Too many attempts. Please try again later.' },
      retryAfterSec: Math.max(1, Math.ceil((entry.resetAt - now) / 1000)),
    };
  }
  return { allowed: true };
}

function checkAuthRateLimit(req) {
  return check(`auth:${clientIp(req)}`, { windowMs: 15 * 60 * 1000, max: 40 });
}

function checkProgressRateLimit(req) {
  return check(`progress:${clientIp(req)}`, { windowMs: 60 * 1000, max: 150 });
}

function checkContactRateLimit(req) {
  return check(`contact:${clientIp(req)}`, { windowMs: 60 * 60 * 1000, max: 5 });
}

module.exports = { checkAuthRateLimit, checkProgressRateLimit, checkContactRateLimit, clientIp };
