/**
 * Clear Google Identity Services state in this browser for our OAuth client.
 * Memora logout does not sign the user out of Google globally; this revokes
 * our app's remembered account so the sign-in button is generic again.
 */
function runClear(email) {
  const googleAccounts = window.google?.accounts?.id;
  if (!googleAccounts) return false;

  try {
    googleAccounts.disableAutoSelect();
  } catch {
    /* ignore */
  }

  if (email) {
    try {
      googleAccounts.revoke(email, () => {});
    } catch {
      /* ignore */
    }
  }
  return true;
}

export function clearGoogleSession(email) {
  if (runClear(email)) return;
  // GIS loads asynchronously; retry once after logout navigation
  setTimeout(() => runClear(email), 400);
}
