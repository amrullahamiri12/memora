const LAST_GOOGLE_EMAIL_KEY = 'memora_last_google_email';

export function rememberGoogleSignIn(email) {
  if (email) {
    sessionStorage.setItem(LAST_GOOGLE_EMAIL_KEY, email.trim().toLowerCase());
  }
}

function getGoogleAccounts() {
  return window.google?.accounts?.id ?? null;
}

/**
 * Memora logout: discourage GIS auto sign-in. Do not call revoke() here —
 * it runs asynchronously and can break an immediate Google sign-in after logout.
 */
export function clearGoogleSession() {
  sessionStorage.removeItem(LAST_GOOGLE_EMAIL_KEY);

  const run = () => {
    const googleAccounts = getGoogleAccounts();
    if (!googleAccounts) return false;

    try {
      googleAccounts.cancel?.();
    } catch {
      /* ignore */
    }

    try {
      googleAccounts.disableAutoSelect();
    } catch {
      /* ignore */
    }

    return true;
  };

  if (run()) return Promise.resolve();
  return new Promise((resolve) => {
    setTimeout(() => {
      run();
      resolve();
    }, 400);
  });
}
