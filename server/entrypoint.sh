#!/usr/bin/env sh
set -e

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo ""
  echo "=========================================="
  echo "[ERROR] DATABASE_URL is not configured!"
  echo "=========================================="
  echo ""
  echo "To fix this in Railway:"
  echo "1. Go to your PostgreSQL service → Variables tab"
  echo "2. Copy the DATABASE_URL value"
  echo "3. Go to your main service → Variables tab"
  echo "4. Add new variable: DATABASE_URL = (paste the value)"
  echo ""
  echo "See SOLUCION_DATABASE_URL.md for detailed instructions"
  echo ""
  echo "=========================================="
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

