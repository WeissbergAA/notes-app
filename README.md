# notes-app

Monorepo учебного fullstack-проекта **Notes App** — сервис заметок и форм с JWT-авторизацией, REST API, Swagger-документацией, Kafka-событиями и React-интерфейсом.

![CI](https://github.com/WeissbergAA/notes-app/actions/workflows/ci.yml/badge.svg)

- **GitHub (app):** https://github.com/WeissbergAA/notes-app  
- **GitHub (infra):** https://github.com/WeissbergAA/notes-infra  

> **Быстрый старт:** [docs/QUICKSTART.ru.md](docs/QUICKSTART.ru.md)

---

## DevOps: где что лежит

Два репозитория: **infra** поднимает платформу, **app** — код и CI приложения.

### Документация (читать по порядку)

| Файл | Зачем |
|------|--------|
| [docs/QUICKSTART.ru.md](docs/QUICKSTART.ru.md) | Запуск с нуля: infra → app → браузер |
| [docs/DEVOPS-TOUR.ru.md](docs/DEVOPS-TOUR.ru.md) | Схема системы, env-контракт, health, сценарий «создал заметку» |
| [docs/CHAOS-LAB.ru.md](docs/CHAOS-LAB.ru.md) | Учебные поломки: что ломать и куда смотреть |
| [docs/architecture.md](docs/architecture.md) | Архитектура (EN) |
| [docs/deploy.md](docs/deploy.md) | Docker-образы, GHCR |

Infra-доки — в репо **[notes-infra](https://github.com/WeissbergAA/notes-infra)**: `docs/runbook.md`, `docs/setup.md`.

### Скрипты и команды (notes-app)

| Что | Где / команда |
|-----|----------------|
| Синхронизация env из infra | `make sync-env` → `scripts/sync-env-from-infra.sh` |
| Установка + миграции + seed | `make setup` → `scripts/setup.sh` |
| Запуск api + consumer + web | `make dev` |
| Статус всего стека | `make status` → `scripts/status.sh` |
| Шпаргалка команд | `Makefile` в корне |

### Health API (наблюдаемость)

| URL | Тип |
|-----|-----|
| `GET /api/v1/health` | Liveness — процесс жив |
| `GET /api/v1/health/ready` | Readiness — Postgres + Kafka (503 если БД нет) |

Код: `apps/api/src/health/`

### CI/CD

| Файл | Job |
|------|-----|
| `.github/workflows/ci.yml` | lint → unit → api e2e → build web |
| `.github/workflows/publish.yml` | Публикация образов в GHCR (по тегу) |

### Переменные окружения (app)

| Файл | Переменные |
|------|------------|
| `apps/api/.env` | `DATABASE_URL`, `KAFKA_BROKERS`, `JWT_SECRET`, `PORT` |
| `apps/consumer/.env` | `DATABASE_URL`, `KAFKA_BROKERS` |
| `apps/web/.env` | `VITE_API_URL` |

Источник портов/паролей БД — **`notes-infra/.env`** (не копируется автоматически, только через `make sync-env`).

### Инфраструктура (другой репозиторий)

| Что | Репо `notes-infra` |
|-----|---------------------|
| Docker Compose | `docker-compose.dev.yml`, `docker-compose.yml` |
| Запуск / стоп | `make up`, `make down`, `scripts/up.sh` |
| Ждать готовности | `make health`, `scripts/healthcheck.sh` |
| Статус ✓/✗ | `make status`, `scripts/status.sh` |
| Бэкап Postgres | `make backup`, `scripts/backup-db.sh` |
| Kafka UI | http://localhost:8080 |
| Kibana (full) | http://localhost:5602 |

---

## Запуск за 3 команды

```bash
# 1. Infra
cd notes-infra && cp .env.example .env && make up && make health

# 2. App — первый раз
cd ../notes-app && make sync-env && make setup

# 3. App — каждый день
make dev && make status
```

| Сервис | URL |
|--------|-----|
| Web | http://localhost:5173 |
| Swagger | http://localhost:3000/api/docs |
| Kafka UI | http://localhost:8080 |
| Kibana (full infra) | http://localhost:5602 |

---

## Зачем нужен этот проект

Notes App — **pet-project для изучения fullstack-разработки и DevOps**:

| Навык | Где практикуется |
|-------|------------------|
| REST API, валидация, auth | `apps/api` (NestJS) |
| API-документация | Swagger UI `/api/docs` |
| Работа с БД | Prisma + PostgreSQL |
| Асинхронные события | Kafka producer + consumer |
| Frontend | React + Vite |
| Автотесты | Jest (unit + API e2e), Playwright (UI) |
| CI/CD | GitHub Actions |
| Разделение infra / app | Два репозитория, env-контракт |
| Наблюдаемость | Pino JSON-логи → Kibana (через notes-infra) |

Личный pet-project на GitHub для практики fullstack и DevOps.

---

## Архитектура

```
┌─────────────┐     HTTP/JWT      ┌─────────────┐
│  apps/web   │ ────────────────► │  apps/api   │
│  React SPA  │                   │   NestJS    │
└─────────────┘                   └──────┬──────┘
                                       │
                    ┌──────────────────┼──────────────────┐
                    ▼                  ▼                  ▼
              PostgreSQL            Kafka           JSON logs
                    ▲                  │
                    │                  ▼
              ┌─────┴──────┐    apps/consumer
              │ event_audit│    (audit записи)
              └────────────┘
```

**Поток запроса:**

1. Пользователь логинится в web → получает JWT.
2. Web вызывает API с заголовком `Authorization: Bearer <token>`.
3. API сохраняет данные в PostgreSQL.
4. API публикует событие в Kafka (`notes.created`, `forms.submitted` и т.д.).
5. Consumer читает Kafka и пишет запись в таблицу `EventAudit`.
6. Логи API/consumer (JSON) при full-профиле infra попадают в Kibana.

Опциональный заголовок **`X-Correlation-Id`** — для трассировки одного запроса через API, Kafka и логи.

---

## Стек технологий

| Компонент | Технология |
|-----------|------------|
| Backend | NestJS, Fastify, TypeScript |
| ORM | Prisma |
| БД | PostgreSQL (из notes-infra) |
| Auth | JWT + bcrypt |
| API docs | Swagger / OpenAPI |
| Логи | Pino (структурированный JSON) |
| Очередь | Kafka (kafkajs) |
| Frontend | React 19, Vite, TanStack Query, React Router |
| Тесты | Jest, Supertest, Playwright |
| Monorepo | npm workspaces |

---

## Структура репозитория

```
notes-app/
├── apps/
│   ├── api/              # REST API, health/ready, Kafka producer
│   ├── web/              # React SPA
│   └── consumer/         # Kafka consumer → EventAudit
├── packages/shared/      # Kafka topics, общие типы
├── scripts/
│   ├── setup.sh          # install + migrate + seed
│   ├── sync-env-from-infra.sh  # DATABASE_URL из notes-infra
│   └── status.sh         # проверка infra + api + web
├── docs/
│   ├── QUICKSTART.ru.md
│   ├── DEVOPS-TOUR.ru.md   # ← DevOps-тур
│   ├── CHAOS-LAB.ru.md     # ← учебные поломки
│   ├── architecture.md
│   └── deploy.md
├── Makefile              # make dev, status, sync-env, …
├── .github/workflows/    # ci.yml, publish.yml
└── package.json
```

---

## Требования

1. **Node.js 20+** (рекомендуется 22 через nvm)
2. **npm 10+**
3. **Docker Desktop** — для notes-infra
4. Запущенный **[notes-infra](https://github.com/WeissbergAA/notes-infra)** (Postgres + Kafka)

Проверка Node:

```bash
node -v   # v20+
npm -v
```

---

## Полная инструкция по запуску

### Шаг 1. Поднять инфраструктуру

В **отдельном** репозитории `notes-infra`:

```bash
cd ~/GolandProjects/awesomeProject/notes-infra
cp .env.example .env
./scripts/up.sh
./scripts/healthcheck.sh
```

Убедись, что Postgres (`5433`) и Kafka (`9093`) healthy.

### Шаг 2. Установить зависимости приложения

```bash
cd ~/GolandProjects/awesomeProject/notes-app
npm run setup
```

### Шаг 3. Запустить приложение

**Одной командой:**

```bash
npm run dev
```

Или в **трёх терминалах** (удобно в GoLand):

```bash
npm run dev:api       # http://localhost:3000 — Swagger: /api/docs
npm run dev:consumer  # Kafka → EventAudit
npm run dev:web       # http://localhost:5173
```

Подробнее: [docs/QUICKSTART.ru.md](docs/QUICKSTART.ru.md)

---

## Как пользоваться приложением

### Через браузер (web)

1. Открой http://localhost:5173
2. **Register** — создай аккаунт (email + пароль мин. 6 символов)
3. **Notes** — создавай, редактируй и удаляй заметки
4. **Forms** — создай форму, заполни и отправь ответ
5. **Events** — просмотр Kafka audit (нужен запущенный consumer)

### Через Swagger

1. Открой http://localhost:3000/api/docs
2. `POST /api/v1/auth/register` или `login` — получи `accessToken`
3. Нажми **Authorize** → вставь `Bearer <token>`
4. Вызывай endpoints Notes и Forms

### Через curl

Примеры в [docs/api.md](docs/api.md):

```bash
# Регистрация
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"user@example.com","password":"secret123"}'

# Создание заметки
curl -X POST http://localhost:3000/api/v1/notes \
  -H "Authorization: Bearer <TOKEN>" \
  -H 'Content-Type: application/json' \
  -H 'X-Correlation-Id: demo-123' \
  -d '{"title":"Моя заметка","body":"Текст","tags":["личное"]}'
```

---

## API endpoints

### Auth (без токена)

| Метод | Путь | Описание |
|-------|------|----------|
| POST | `/api/v1/auth/register` | Регистрация |
| POST | `/api/v1/auth/login` | Вход |
| GET | `/api/v1/auth/me` | Профиль (JWT) |

### Notes (JWT обязателен)

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/api/v1/notes` | Список заметок |
| POST | `/api/v1/notes` | Создать |
| GET | `/api/v1/notes/:id` | Получить |
| PATCH | `/api/v1/notes/:id` | Обновить |
| DELETE | `/api/v1/notes/:id` | Удалить |

### Forms (JWT обязателен)

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/api/v1/forms` | Список форм |
| POST | `/api/v1/forms` | Создать форму |
| GET | `/api/v1/forms/:id` | Получить форму |
| POST | `/api/v1/forms/:id/submit` | Отправить ответ |

### System

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/api/v1/health` | Liveness |
| GET | `/api/v1/health/ready` | Readiness (Postgres + Kafka) |
| GET | `/api/docs` | Swagger UI |

---

## Модель данных

| Таблица | Назначение |
|---------|------------|
| `User` | email, passwordHash |
| `Note` | title, body, tags[], userId |
| `Form` | title, schema (JSON полей) |
| `FormSubmission` | data (JSON ответа) |
| `EventAudit` | topic, payload, correlationId (из Kafka consumer) |

---

## Kafka-события

| Topic | Когда публикуется |
|-------|-------------------|
| `notes.created` | Создана заметка |
| `notes.updated` | Обновлена заметка |
| `notes.deleted` | Удалена заметка |
| `forms.submitted` | Отправлена форма |

Consumer (`apps/consumer`) записывает каждое событие в `EventAudit`.

---

## Тесты

### Unit-тесты (AuthService)

```bash
npm run test -w @notes/api
```

### API integration (e2e, нужен Postgres)

```bash
# notes-infra должна быть запущена
npm run test:e2e -w @notes/api
```

### UI e2e (Playwright, нужны api + web)

```bash
npx playwright install chromium   # один раз
npm run dev:api &
npm run dev:web &
npm run test:e2e -w @notes/web
```

### Lint и сборка

```bash
npm run lint
npm run build
```

---

## CI/CD (GitHub Actions)

При push/PR в `main`:

| Job | Что делает |
|-----|------------|
| `lint` | TypeScript check по workspaces |
| `test-unit` | Unit-тесты API |
| `test-api` | E2E API с Postgres service container |
| `build-web` | Production build React |

---

## Запуск в GoLand

1. **File → Open** → папка `notes-app`
2. **Settings → Node.js** → interpreter `~/.nvm/.../node`
3. Создай **npm Run Configuration**:
   - `dev:api` — script из root `package.json`
   - `dev:web`
   - `dev:consumer`
4. Infra удобнее держать в **отдельном окне** GoLand на `notes-infra`

---

## Docker (опционально)

API можно собрать в образ и подключить к сети `notes-net`:

```bash
docker build -f apps/api/Dockerfile -t notes-api:local .
docker run --rm -p 3000:3000 --network notes-net \
  -e DATABASE_URL=postgresql://notes:notes@notes-postgres:5432/notes?schema=public \
  -e KAFKA_BROKERS=notes-kafka:9092 \
  -e JWT_SECRET=local-dev-secret \
  notes-api:local
```

Подробнее: [docs/deploy.md](docs/deploy.md)

---

## Переменные окружения

### apps/api

| Переменная | Описание |
|------------|----------|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Секрет для подписи JWT |
| `JWT_EXPIRES_IN` | Время жизни токена (напр. `24h`) |
| `KAFKA_BROKERS` | Адрес Kafka (`localhost:9093`) |
| `PORT` | Порт API (3000) |
| `LOG_LEVEL` | Уровень логов Pino |

### apps/web

| Переменная | Описание |
|------------|----------|
| `VITE_API_URL` | URL API для браузера |

### apps/consumer

| Переменная | Описание |
|------------|----------|
| `DATABASE_URL` | Тот же Postgres |
| `KAFKA_BROKERS` | Тот же Kafka |

---

## Типовые проблемы

| Проблема | Решение |
|----------|---------|
| `Can't reach database` | Запусти notes-infra, проверь `DATABASE_URL` и порт 5433 |
| `401 Unauthorized` | Проверь JWT в заголовке; перелогинься |
| Kafka events не пишутся | Запусти `npm run dev:consumer`; проверь Kafka на 9093 |
| Web не видит API | Проверь `VITE_API_URL`, CORS не нужен (разные порты, но same-origin не требуется для dev) |
| E2E падает | Убедись, что api + web + postgres запущены |

---

## Связанные репозитории

| Репо | Роль |
|------|------|
| [notes-infra](https://github.com/WeissbergAA/notes-infra) | Docker: Postgres, Kafka, ELK |
| **notes-app** (этот) | Код приложения |

**Порядок клонирования и запуска:** сначала infra, потом app.

---

## Дополнительная документация

- [docs/QUICKSTART.ru.md](docs/QUICKSTART.ru.md) — пошаговый запуск
- [docs/DEVOPS-TOUR.ru.md](docs/DEVOPS-TOUR.ru.md) — DevOps для начинающих
- [docs/CHAOS-LAB.ru.md](docs/CHAOS-LAB.ru.md) — учебные инциденты
- [docs/api.md](docs/api.md) — примеры curl
- [docs/architecture.md](docs/architecture.md) — архитектура
- [docs/deploy.md](docs/deploy.md) — деплой, GHCR
- [CHANGELOG.md](CHANGELOG.md) — история версий

---

## Roadmap (не в MVP)

- Kubernetes / Helm
- OAuth / social login
- GitHub Environments для staging
- Outbox pattern для Kafka

---

## Статус

Учебный проект **v0.2.0**. Подходит для практики DevOps и fullstack, не для production без доработок безопасности и эксплуатации.
