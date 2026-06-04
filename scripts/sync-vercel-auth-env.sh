#!/usr/bin/env bash
# Sync auth env vars to Vercel production. Run from repo root after `npx vercel link`.
set -euo pipefail
cd "$(dirname "$0")/.."

add_env() {
  local name="$1"
  local value="$2"
  if [ -z "$value" ]; then
    echo "skip $name (not set in environment)"
    return 0
  fi
  echo "Setting $name on Vercel production..."
  printf '%s' "$value" | npx vercel env add "$name" production --force 2>/dev/null \
    || printf '%s' "$value" | npx vercel env add "$name" production
}

add_env APP_URL "${APP_URL:-https://memora.cards}"
add_env EMAIL_FROM "${EMAIL_FROM:-Memora <noreply@memora.cards>}"
add_env RESEND_API_KEY "${RESEND_API_KEY:-}"
add_env GOOGLE_CLIENT_ID "${GOOGLE_CLIENT_ID:-}"
add_env VITE_GOOGLE_CLIENT_ID "${VITE_GOOGLE_CLIENT_ID:-${GOOGLE_CLIENT_ID:-}}"

echo "Done. Redeploy: npx vercel --prod"
