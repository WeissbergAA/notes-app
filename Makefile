.PHONY: help infra-up infra-down infra-status infra-health sync-env setup dev status backup-db

INFRA_DIR ?= ../notes-infra

help:
	@echo "Notes App — DevOps shortcuts"
	@echo ""
	@echo "  make infra-up      Start Postgres + Kafka (notes-infra)"
	@echo "  make infra-down    Stop infra (dev profile)"
	@echo "  make infra-status  Check Docker / Postgres / Kafka"
	@echo "  make infra-health  Wait until infra is ready"
	@echo "  make sync-env      Copy DATABASE_URL + KAFKA_BROKERS from notes-infra"
	@echo "  make setup         npm install + migrate + seed"
	@echo "  make dev           Run api + consumer + web"
	@echo "  make status        Full stack status (infra + app)"
	@echo "  make free-ports     Free API :3000 + Web :5173"
	@echo "  make kill-ports    Free all ports + docker compose down (infra)"

infra-up:
	cd $(INFRA_DIR) && ./scripts/up.sh

infra-down:
	cd $(INFRA_DIR) && ./scripts/down.sh

infra-status:
	cd $(INFRA_DIR) && ./scripts/status.sh

infra-health:
	cd $(INFRA_DIR) && ./scripts/healthcheck.sh

sync-env:
	bash scripts/sync-env-from-infra.sh

setup: sync-env
	npm run setup

free-ports:
	bash scripts/free-ports.sh

kill-ports:
	bash scripts/free-ports.sh --all

dev:
	npm run dev

status:
	bash scripts/status.sh

backup-db:
	cd $(INFRA_DIR) && ./scripts/backup-db.sh
