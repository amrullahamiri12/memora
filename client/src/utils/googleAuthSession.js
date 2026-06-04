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
 * Clear Google Identity Services state for Memora's OAuth client.
 * Revokes every known Google email hint (last Google sign-in + linked Memora email).
 */
export function clearGoogleSession({ memoraEmail, hasGoogle } = {}) {
  const hints = new Set();
  const lastGoogle = sessionStorage.getItem(LAST_GOOGLE_EMAIL_KEY);
  if (lastGoogle) hints.add(lastGoogle);
  if (hasGoogle && memoraEmail) hints.add(memoraEmail.trim().toLowerCase());
  sessionStorage.removeItem(LAST_GOOGLE_EMAIL_KEY);

  const run = () => {
    const googleAccounts = getGoogleAccounts();
    if (!googleAccounts) return Promise.resolve();

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

    const emails = [...hints];
    if (emails.length === 0) return Promise.resolve();

    return Promise.all(
      emails.map(
        (email) =>
          new Promise((resolve) => {
            try {
              googleAccounts.revoke(email, () => resolve());
            } catch {
              resolve();
            }
          })
      )
    );
  };

  return run().then(() => {
    if (getGoogleAccounts()) return;
    return new Promise((resolve) => {
      setTimeout(() => {
        run().then(resolve);
      }, 400);
    });
  });
}
