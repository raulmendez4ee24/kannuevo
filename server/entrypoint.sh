#!/usr/bin/env sh
set -e

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "[error] DATABASE_URL environment variable is not set"
  echo "[error] Please ensure PostgreSQL service is connected or DATABASE_URL is configured"
  exit 1
fi

echo "[boot] DATABASE_URL is set, proceeding with database setup"
echo "[boot] prisma db push"
npx prisma db push --accept-data-loss || {
  echo "[error] Failed to push database schema"
  exit 1
}

if [ "${SEED_DEMO:-true}" = "true" ] || [ "${SEED_DEMO:-1}" = "1" ]; then
  echo "[boot] seed demo data"
  npm run seed || {
    echo "[warn] Seed failed, continuing anyway"
  }
fi

echo "[boot] start server"
node dist/index.js

