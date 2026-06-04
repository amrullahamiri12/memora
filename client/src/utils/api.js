const TOKEN_KEY = 'flashcard_token';

/** Same-origin `/api` on Vercel; override with VITE_API_URL for split hosting */
export const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

export function apiUrl(path) {
  return `${API_BASE}/api${path}`;
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export async function api(path, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let res;
  try {
    res = await fetch(apiUrl(path), {
      ...options,
      headers,
    });
  } catch {
    const host = typeof window !== 'undefined' ? window.location.hostname : '';
    const isLocal = host === 'localhost' || host === '127.0.0.1';
    if (isLocal) {
      throw new Error(
        'Cannot connect to the API. From the project folder run: npm run dev (starts client + server on port 5001).'
      );
    }
    throw new Error('Cannot reach the API. Wait a moment and try again, or refresh the page.');
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const message =
      data.error ||
      data.config ||
      data.errors?.[0]?.msg ||
      (res.status === 403 && !data.error
        ? 'You do not have permission to perform this action.'
        : res.status === 504
          ? 'Server timed out. Wait a few seconds and try again.'
          : `Request failed (${res.status})`);
    throw new Error(message);
  }

  return data;
}

/** Download a CSV (or other file) from an authenticated API path. */
export async function downloadAuthenticatedFile(path) {
  const token = getToken();
  const res = await fetch(apiUrl(path), {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Download failed (${res.status})`);
  }
  const disposition = res.headers.get('Content-Disposition');
  const filename =
    disposition?.match(/filename="([^"]+)"/)?.[1] ||
    disposition?.match(/filename=([^;\s]+)/)?.[1] ||
    'export.csv';
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
