#!/usr/bin/env bash
# Синхронизация DATABASE_URL и KAFKA_BROKERS из notes-infra/.env → notes-app
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

INFRA_DIR="${INFRA_DIR:-$(cd "$ROOT_DIR/../notes-infra" 2>/dev/null && pwd || true)}"
INFRA_ENV="${INFRA_DIR}/.env"

if [[ ! -f "$INFRA_ENV" ]]; then
  echo "ERROR: notes-infra .env not found at: $INFRA_ENV"
  echo "Set INFRA_DIR or clone notes-infra next to notes-app:"
  echo "  awesomeProject/notes-infra"
  echo "  awesomeProject/notes-app"
  exit 1
fi

# shellcheck disable=SC1091
source "$INFRA_ENV"

POSTGRES_USER="${POSTGRES_USER:-notes}"
POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-notes}"
POSTGRES_DB="${POSTGRES_DB:-notes}"
POSTGRES_PORT="${POSTGRES_PORT:-5433}"
KAFKA_PORT="${KAFKA_PORT:-9093}"

DATABASE_URL="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@localhost:${POSTGRES_PORT}/${POSTGRES_DB}?schema=public"
KAFKA_BROKERS="localhost:${KAFKA_PORT}"

update_env() {
  local file="$1"
  local example
  example="$(dirname "$file")/.env.example"

  if [[ ! -f "$file" ]]; then
    if [[ -f "$example" ]]; then
      cp "$example" "$file"
    else
      touch "$file"
    fi
  fi

  local tmp
  tmp="$(mktemp)"
  grep -v -E '^(DATABASE_URL|KAFKA_BROKERS)=' "$file" > "$tmp" || true
  {
    cat "$tmp"
    echo "DATABASE_URL=${DATABASE_URL}"
    echo "KAFKA_BROKERS=${KAFKA_BROKERS}"
  } > "${file}.new"
  mv "${file}.new" "$file"
  rm -f "$tmp"
}

echo "==> Sync from ${INFRA_ENV}"
echo "    DATABASE_URL=${DATABASE_URL}"
echo "    KAFKA_BROKERS=${KAFKA_BROKERS}"
echo ""

update_env "$ROOT_DIR/apps/api/.env"
update_env "$ROOT_DIR/apps/consumer/.env"

echo "Updated:"
echo "  apps/api/.env"
echo "  apps/consumer/.env"
echo ""
echo "Other keys (JWT_SECRET, CORS, VITE_API_URL) were left unchanged."
