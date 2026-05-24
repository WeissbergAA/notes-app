# Chaos Lab — учебные поломки

Безопасные эксперименты **только на локальной машине**.  
Цель: понять, **что сломается** и **куда смотреть**, когда что-то не работает.

Перед каждым упражнением:

```bash
cd notes-infra && make up && make health
cd ../notes-app && make dev
make status   # всё зелёное
```

После поломки — восстановление в конце каждого блока.

---

## Упражнение 1: Infra не запущена

**Действие:**

```bash
cd notes-infra && make down
# notes-app оставь запущенным или запусти только API
```

**Ожидаемое:**

| Симптом | Причина |
|---------|---------|
| `curl .../health/ready` → 503, postgres `down` | Нет БД |
| Login / Notes → ошибка | API не достучится до Postgres |
| Consumer падает или ретраит | Нет Kafka |

**Куда смотреть:**

```bash
curl -s http://localhost:3000/api/v1/health/ready | jq
docker ps | grep notes
```

**Восстановление:** `cd notes-infra && make up && make health`

---

## Упражнение 2: Kafka остановлен

**Действие:**

```bash
docker stop notes-kafka
```

**Ожидаемое:**

| Компонент | Поведение |
|-----------|-----------|
| API | Заметки **создаются** (Postgres работает) |
| API readiness | `status: degraded`, kafka `down` |
| Events в web | **Пусто** (consumer не получает) |
| Kafka UI | Не открывается / ошибка |

**Куда смотреть:**

```bash
curl -s http://localhost:3000/api/v1/health/ready | jq .checks.kafka
docker logs notes-consumer --tail 20
```

**Восстановление:** `docker start notes-kafka` → подожди 30 сек → перезапусти consumer (`npm run dev:consumer`)

---

## Упражнение 3: Consumer не запущен

**Действие:** запусти только API + Web (без consumer):

```bash
npm run dev:api   # терминал 1
npm run dev:web   # терминал 2
```

Создай заметку.

**Ожидаемое:**

| Где | Результат |
|-----|-----------|
| Notes в web | ✅ Есть |
| Kafka UI → `notes.created` | ✅ Сообщение есть |
| Events в web | ❌ Пусто |

**Вывод:** Kafka доставляет асинхронно; без consumer audit в БД не появится.

**Восстановление:** `npm run dev:consumer` или `npm run dev`

---

## Упражнение 4: Неверный DATABASE_URL

**Действие:** в `apps/api/.env` временно смени порт:

```env
DATABASE_URL=postgresql://notes:notes@localhost:9999/notes?schema=public
```

Перезапусти API.

**Ожидаемое:** `/health/ready` → postgres `down`, HTTP 503.

**Восстановление:**

```bash
make sync-env
# перезапусти API
```

---

## Упражнение 5: Порт API занят (EADDRINUSE)

**Действие:** запусти `npm run dev` дважды или оставь старый процесс на :3000.

**Ожидаемое:** в логах `EADDRINUSE :3000`, web не может залогиниться.

**Куда смотреть:**

```bash
lsof -ti :3000
kill $(lsof -ti :3000)
```

---

## Упражнение 6: Потеря данных Postgres

**Действие (осторожно!):**

```bash
cd notes-infra
make backup          # сначала бэкап!
docker compose -f docker-compose.dev.yml down -v   # удалит volume
make up && make health
cd ../notes-app && make setup   # пустая БД + seed
```

**Ожидаемое:** все заметки пропали.

**Восстановление из бэкапа:**

```bash
./scripts/restore-db.sh backups/notes-XXXX.sql
```

**Вывод DevOps:** контейнер ephemeral, **volume** — данные; без бэкапа `down -v` = потеря.

---

## Шпаргалка «если сломалось»

| Симптом | Первое действие |
|---------|-----------------|
| Всё красное | `make status` |
| API 503 ready | `cd notes-infra && make health` |
| Events пусто | consumer запущен? Kafka up? |
| Login не работает | API на :3000? `curl localhost:3000/api/v1/health` |
| Kafka UI пустой | создай заметку после старта Kafka |
| Порты заняты | `lsof -ti :3000 \| xargs kill` |

---

См. также: [DEVOPS-TOUR.ru.md](./DEVOPS-TOUR.ru.md)
