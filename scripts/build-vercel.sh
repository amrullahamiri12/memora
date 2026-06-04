#!/usr/bin/env bash
set -euo pipefail

# Tests run in GitHub Actions on push; skip on Vercel to avoid dev deps in the deploy graph.
if [ -z "${VERCEL:-}" ]; then
  npm run test
fi

npm run sync:openapi

cd server
npx prisma generate
if [ -n "${DATABASE_URL:-}" ]; then
  npx prisma db push --skip-generate
fi
if [ "${SEED_ON_BUILD:-}" = "true" ]; then
  node -r dotenv/config prisma/seed.js
fi
cd ..

cd client
npx vite build
