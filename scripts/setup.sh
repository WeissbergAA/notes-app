#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "==> Installing dependencies"
npm install

echo "==> Copying .env files (if missing)"
cp -n apps/api/.env.example apps/api/.env || true
cp -n apps/web/.env.example apps/web/.env || true
cp -n apps/consumer/.env.example apps/consumer/.env || true

echo "==> Prisma generate + migrate"
npm run prisma:generate -w @notes/api
npx prisma migrate deploy --schema apps/api/prisma/schema.prisma

echo "==> Done. Start all services:"
echo "  npm run dev          # api + consumer + web в одном терминале"
echo ""
echo "  или по отдельности:"
echo "  npm run dev:api"
echo "  npm run dev:consumer"
echo "  npm run dev:web"
