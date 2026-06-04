const { randomBytes, createHash } = require('crypto');

function hashToken(token) {
  return createHash('sha256').update(token).digest('hex');
}

function generateToken() {
  return randomBytes(32).toString('hex');
}

function verificationExpiry() {
  return new Date(Date.now() + 24 * 60 * 60 * 1000);
}

function resetExpiry() {
  return new Date(Date.now() + 60 * 60 * 1000);
}

module.exports = {
  hashToken,
  generateToken,
  verificationExpiry,
  resetExpiry,
};
