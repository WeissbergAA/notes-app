#!/usr/bin/env bash
# Полный статус: infra + API readiness + web
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

API_URL="${API_URL:-http://localhost:3000}"
WEB_URL="${WEB_URL:-http://localhost:5173}"
INFRA_DIR="${INFRA_DIR:-$ROOT_DIR/../notes-infra}"

PASS=0
FAIL=0

green() { printf '\033[32m✓\033[0m %s\n' "$1"; }
red() { printf '\033[31m✗\033[0m %s\n' "$1"; }
yellow() { printf '\033[33m!\033[0m %s\n' "$1"; }

check() {
  local name="$1"
  shift
  if "$@"; then
    green "$name"
    PASS=$((PASS + 1))
  else
    red "$name"
    FAIL=$((FAIL + 1))
  fi
}

echo "=== notes-app full stack status ==="
echo ""

# --- Infra ---
if [[ -x "${INFRA_DIR}/scripts/status.sh" ]]; then
  echo "--- Infrastructure ---"
  if bash "${INFRA_DIR}/scripts/status.sh" dev; then
    PASS=$((PASS + 1))
  else
    FAIL=$((FAIL + 1))
    yellow "Infra not healthy — run: cd notes-infra && ./scripts/up.sh"
  fi
  echo ""
else
  yellow "notes-infra not found at ${INFRA_DIR} — skip infra checks"
  echo ""
fi

# --- API ---
echo "--- Application ---"

check "API liveness ${API_URL}/api/v1/health" \
  curl -sf "${API_URL}/api/v1/health" | grep -q '"status":"ok"'

READY_JSON="$(curl -sf "${API_URL}/api/v1/health/ready" 2>/dev/null || echo '{}')"
if echo "$READY_JSON" | grep -q '"postgres".*"status":"up"'; then
  green "API readiness — Postgres up"
  PASS=$((PASS + 1))
else
  red "API readiness — Postgres down or API not running"
  FAIL=$((FAIL + 1))
fi

if echo "$READY_JSON" | grep -q '"kafka".*"status":"up"'; then
  green "API readiness — Kafka up"
  PASS=$((PASS + 1))
else
  yellow "API readiness — Kafka down (events will be skipped)"
fi

check "Web ${WEB_URL}" curl -sf "${WEB_URL}" >/dev/null 2>&1

echo ""
echo "--- Quick links ---"
echo "  Web:       ${WEB_URL}"
echo "  API:       ${API_URL}"
echo "  API ready: ${API_URL}/api/v1/health/ready"
echo "  Swagger:   ${API_URL}/api/docs"
echo "  Kafka UI:  http://localhost:8080"
echo "  Events:    ${WEB_URL}/events"
echo ""

if [[ $FAIL -eq 0 ]]; then
  green "Stack OK ($PASS checks passed)"
  exit 0
fi

red "Issues found ($FAIL failed). See messages above."
exit 1
