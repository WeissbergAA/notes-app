# v0.2.0

## Added

- **Kafka UI** в notes-infra (http://localhost:8080) — просмотр топиков и сообщений
- **GET /api/v1/events/audit** — список Kafka-событий текущего пользователя
- **Страница Events** в web — мониторинг audit с auto-refresh
- **Редактирование заметок** в UI (PATCH)
- **CORS** для локальной разработки web + api
- **docker-compose.app.yml** — запуск API и consumer в Docker
- **GHCR workflow** — публикация образов при push тега `v*`
- **scripts/setup.sh** — одной командой install + migrate

## Changed

- Улучшены README (RU), стили web

# v0.1.0

## Added

- NestJS API with JWT auth, Notes CRUD, Forms submit
- Swagger at `/api/docs`
- Kafka producer and consumer with `EventAudit`
- React web UI (login, notes, forms)
- Prisma + PostgreSQL migrations
- GitHub Actions CI (lint, unit, e2e, build-web)
- Pino structured logging
- Docker API image and deploy docs

## Infra (notes-infra)

- PostgreSQL, Kafka (dev profile)
- Elasticsearch, Kibana, Filebeat (full profile)
