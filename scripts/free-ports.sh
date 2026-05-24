#!/usr/bin/env bash
# Освобождает порты dev-стека Notes App + останавливает notes-infra (Docker)
#
# Использование:
#   ./scripts/free-ports.sh        # только app: API :3000, Web :5173
#   ./scripts/free-ports.sh --all  # app + docker compose down (Postgres, Kafka, …)
#
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
INFRA_DIR="${INFRA_DIR:-$ROOT_DIR/../notes-infra}"

# notes-app
APP_PORTS=(3000 5173)

# notes-infra (проброс с хоста; основной способ — docker compose down)
INFRA_PORTS=(5433 9093 8080 9200 5602)

free_port() {
  local port="$1"
  local pids
  pids="$(lsof -ti :"${port}" 2>/dev/null || true)"
  if [[ -z "$pids" ]]; then
    echo "  :${port} — свободен"
    return 0
  fi
  echo "  :${port} — завершаю PID: ${pids//$'\n'/ }"
  # shellcheck disable=SC2086
  kill ${pids} 2>/dev/null || true
  sleep 0.3
  pids="$(lsof -ti :"${port}" 2>/dev/null || true)"
  if [[ -n "$pids" ]]; then
    # shellcheck disable=SC2086
    kill -9 ${pids} 2>/dev/null || true
  fi
  if lsof -ti :"${port}" >/dev/null 2>&1; then
    echo "  :${port} — всё ещё занят (возможно Docker; используй --all)"
  else
    echo "  :${port} — свободен"
  fi
}

echo "=== notes-app ==="
for port in "${APP_PORTS[@]}"; do
  free_port "${port}"
done

if [[ "${1:-}" == "--all" ]] || [[ "${1:-}" == "all" ]]; then
  echo ""
  echo "=== notes-infra (Docker) ==="
  if [[ -d "${INFRA_DIR}" ]]; then
    if [[ -x "${INFRA_DIR}/scripts/down.sh" ]]; then
      (cd "${INFRA_DIR}" && ./scripts/down.sh) || true
      echo "  docker compose down (dev) — выполнено"
    else
      echo "  notes-infra не найден: ${INFRA_DIR}"
    fi
  else
    echo "  Папка notes-infra не найдена: ${INFRA_DIR}"
  fi

  echo ""
  echo "=== проверка портов infra на хосте ==="
  for port in "${INFRA_PORTS[@]}"; do
    free_port "${port}"
  done
fi

echo ""
echo "Готово. Запуск: cd notes-infra && make up  →  cd notes-app && npm run dev"
