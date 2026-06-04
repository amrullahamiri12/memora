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
      (res.status === 403
        ? 'Server unreachable — on macOS, port 5000 is used by AirPlay. The API runs on port 5001.'
        : `Request failed (${res.status})`);
    throw new Error(message);
  }

  return data;
}
