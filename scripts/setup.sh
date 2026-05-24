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

if [[ ! -f apps/api/.env ]]; then
  echo "ERROR: apps/api/.env not found. Copy from apps/api/.env.example"
  exit 1
fi

# Prisma CLI из корня monorepo не подхватывает apps/api/.env автоматически
set -a
# shellcheck disable=SC1091
source apps/api/.env
set +a

npx prisma migrate deploy --schema apps/api/prisma/schema.prisma

echo "==> Seed default admin user"
npm run prisma:seed -w @notes/api

echo "==> Done. Default login: admin / admin"
echo "==> Start all services:"
echo "  npm run dev          # api + consumer + web в одном терминале"
echo ""
echo "  или по отдельности:"
echo "  npm run dev:api"
echo "  npm run dev:consumer"
echo "  npm run dev:web"
