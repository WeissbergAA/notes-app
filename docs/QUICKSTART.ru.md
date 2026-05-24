# Быстрый старт Notes App

Пошаговая инструкция: от нуля до работающего приложения в браузере.

---

## Что получится в итоге

| URL | Что это |
|-----|---------|
| http://localhost:5173 | Web-интерфейс (заметки, формы, events) |
| http://localhost:3000/api/docs | Swagger — документация API |
| http://localhost:3000/api/v1/health | Liveness API |
| http://localhost:3000/api/v1/health/ready | Readiness (Postgres + Kafka) |
| http://localhost:8080 | Kafka UI — топики и сообщения |
| http://localhost:5602 | Kibana — логи (только full-профиль infra) |

---

## Что нужно заранее

| Инструмент | Версия | Проверка |
|------------|--------|----------|
| Docker Desktop | актуальный | `docker info` |
| Node.js | 20+ (лучше 22) | `node -v` |
| npm | 10+ | `npm -v` |
| Git | любой | `git --version` |

---

## Схема запуска

```
  ШАГ 1                ШАГ 2                 ШАГ 3
notes-infra  ──────►  notes-app setup  ──────►  npm run dev
(Postgres+Kafka)      (install+migrate)        (api+consumer+web)
```

Infra **всегда первой**. Без Postgres и Kafka API не стартует нормально.

**Для изучения DevOps:** [DEVOPS-TOUR.ru.md](./DEVOPS-TOUR.ru.md) · [CHAOS-LAB.ru.md](./CHAOS-LAB.ru.md)

---

## Шаг 1 — Инфраструктура (notes-infra)

```bash
cd ~/GolandProjects/awesomeProject/notes-infra

cp .env.example .env
make up            # или ./scripts/up.sh
make health        # или ./scripts/healthcheck.sh
make status        # быстрая проверка ✓/✗
```

Ожидаемый вывод healthcheck:

```
PostgreSQL is ready
Kafka is ready
All services are healthy
```

### Проверка вручную

```bash
docker compose -f docker-compose.dev.yml ps
```

Все сервисы должны быть `healthy` или `running`.

### Полезные ссылки после старта

- **Kafka UI:** http://localhost:8080
- **Postgres:** `localhost:5433`, user/pass/db = `notes`

### Full-профиль (логи + Kibana) — опционально

```bash
./scripts/down.sh
./scripts/up.sh full
./scripts/healthcheck.sh full
```

Kibana: http://localhost:5602

---

## Шаг 2 — Приложение (notes-app), первый раз

```bash
cd ~/GolandProjects/awesomeProject/notes-app

make sync-env       # DATABASE_URL + KAFKA_BROKERS из notes-infra/.env
npm run setup       # или: make setup (sync-env + setup)
```

Скрипт `setup` делает:

1. `npm install`
2. копирует `.env.example` → `.env` (если файлов ещё нет)
3. `prisma generate` + `prisma migrate deploy` + seed **admin / admin**

---

## Шаг 3 — Запуск приложения

### Вариант A — одна команда (рекомендуется)

```bash
npm run dev
```

Поднимет **одновременно** в одном терминале:

- API на `:3000`
- Consumer (Kafka)
- Web на `:5173`

Цветной вывод: `[api]`, `[consumer]`, `[web]`.

Проверка всего стека:

```bash
make status
# или: npm run status
```

### Вариант B — три терминала (GoLand / отладка)

```bash
# Терминал 1
npm run dev:api

# Терминал 2
npm run dev:consumer

# Терминал 3
npm run dev:web
```

### Вариант C — API + consumer в Docker

Infra должна быть запущена (`notes-net`):

```bash
npm run docker:app
# Web всё равно локально:
npm run dev:web
```

---

## Шаг 4 — Открыть и проверить

### 1. Web UI

1. Открой http://localhost:5173
2. **Register** → email + пароль (мин. 6 символов)
3. **Notes** → создай заметку → **Edit** → сохрани
4. **Forms** → Create default form → Fill form → Submit
5. **Events** → должны появиться Kafka-события (нужен consumer)

### 2. Swagger

1. http://localhost:3000/api/docs
2. `POST /auth/register` или `login`
3. **Authorize** → `Bearer <accessToken>`
4. Попробуй `GET /notes`, `POST /notes`

### 3. Kafka UI

1. http://localhost:8080
2. Topics → `notes.created`, `forms.submitted`
3. После действий в web — сообщения в топиках

### 4. Health

```bash
curl http://localhost:3000/api/v1/health
# {"status":"ok","service":"notes-api"}
```

---

## Запуск в GoLand

1. **Окно 1:** Open → `notes-infra` (Docker-контейнеры)
2. **Окно 2:** Open → `notes-app`
3. **Settings → Node.js** → interpreter из nvm (`node 22`)
4. **Run Configuration → npm:**
   - `setup` — один раз
   - `dev` — основной запуск
   - или отдельно `dev:api`, `dev:consumer`, `dev:web`

---

## Ежедневный workflow

```bash
# Утро — включил Docker Desktop

cd notes-infra && ./scripts/up.sh && cd ..

cd notes-app && npm run dev

# Вечер — остановить
# Ctrl+C в терминале с dev
cd notes-infra && ./scripts/down.sh
```

---

## Остановка

```bash
# Приложение
Ctrl+C   # в терминале npm run dev

# Инфраструктура
cd notes-infra
./scripts/down.sh          # dev-профиль
./scripts/down.sh full       # full-профиль
```

---

## Частые проблемы

| Симптом | Причина | Решение |
|---------|---------|---------|
| `Cannot connect to Docker` | Docker Desktop выключен | Запусти Docker Desktop |
| `Can't reach database` | Infra не поднята | `./scripts/up.sh` в notes-infra |
| Kafka UI пустой | Kafka ещё стартует | Подожди 30–60 сек, refresh |
| Events пустые | Consumer не запущен | `npm run dev:consumer` или `npm run dev` |
| Consumer: `This server does not host this topic-partition` | Топики Kafka ещё не созданы | Перезапусти `npm run dev` (consumer создаёт топики при старте); убедись что infra поднята |
| `EADDRINUSE` на порту 3000 | Старый процесс API ещё работает | `npm run free-ports` или `make kill-ports` (всё) |
| `401` в web | Токен протух / не залогинен | Logout → Login |
| Порт 5433 занят | Другой Postgres | Смени `POSTGRES_PORT` в `.env` infra + `DATABASE_URL` в api |
| Web не грузит API | Неверный URL | Проверь `apps/web/.env`: `VITE_API_URL=http://localhost:3000` |

---

## Переменные окружения (шпаргалка)

### notes-infra `.env`

```env
POSTGRES_PORT=5433
KAFKA_PORT=9093
KAFKA_UI_PORT=8080
```

### notes-app `apps/api/.env`

```env
DATABASE_URL=postgresql://notes:notes@localhost:5433/notes?schema=public
KAFKA_BROKERS=localhost:9093
JWT_SECRET=change-me-in-production
CORS_ORIGIN=http://localhost:5173
PORT=3000
```

### notes-app `apps/web/.env`

```env
VITE_API_URL=http://localhost:3000
```

---

## Полезные команды

```bash
# Линты
npm run lint

# Сборка
npm run build

# Unit-тесты
npm run test -w @notes/api

# API e2e (нужен Postgres)
npm run test:e2e -w @notes/api

# UI e2e Playwright (нужны api + web)
npm run test:e2e -w @notes/web
```

---

## Связанные документы

- [README](../README.md) — обзор проекта
- [api.md](api.md) — примеры curl
- [architecture.md](architecture.md) — архитектура
- [deploy.md](deploy.md) — Docker-образы, GHCR
- [notes-infra README](https://github.com/WeissbergAA/notes-infra) — инфраструктура
