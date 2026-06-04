const GUEST_EMAIL_SUFFIX = '@guest.memora.local';

function isGuestEmail(email) {
  return typeof email === 'string' && email.endsWith(GUEST_EMAIL_SUFFIX);
}

module.exports = {
  GUEST_EMAIL_SUFFIX,
  isGuestEmail,
};
