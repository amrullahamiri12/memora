export const GUEST_EMAIL_SUFFIX = '@guest.memora.local';

export function isGuestUser(user) {
  if (!user) return false;
  if (user.isGuest === true) return true;
  return typeof user.email === 'string' && user.email.endsWith(GUEST_EMAIL_SUFFIX);
}
