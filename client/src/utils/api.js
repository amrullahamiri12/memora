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

  const controller = new AbortController();
  const timeoutMs = 25000;
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  let res;
  try {
    res = await fetch(apiUrl(path), {
      ...options,
      headers,
      signal: controller.signal,
    });
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error(
        'Request timed out. If /api/ping works, the database query is slow — check DATABASE_URL uses Supabase pooler (port 6543) and redeploy.'
      );
    }
    throw new Error(
      'Cannot connect to the server. Run `npm run dev` in the server folder (port 5001).'
    );
  } finally {
    clearTimeout(timeoutId);
  }

  const text = await res.text();
  let data = {};
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      if (text.includes('FUNCTION_INVOCATION_FAILED')) {
        throw new Error(
          'The API failed to start. In Vercel, set DATABASE_URL (pooler, port 6543, ?pgbouncer=true), DIRECT_URL (port 5432), and JWT_SECRET (32+ characters), then redeploy.'
        );
      }
    }
  }

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
