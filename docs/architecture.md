# Architecture

## Components

- **notes-infra** — PostgreSQL, Kafka, Elasticsearch, Kibana, Filebeat
- **notes-api** — REST API, JWT auth, Kafka producer, Pino JSON logs
- **notes-consumer** — reads Kafka topics, writes `EventAudit`
- **notes-web** — React SPA

## Event flow

1. Client calls API with optional `X-Correlation-Id`
2. API writes to PostgreSQL
3. API publishes Kafka event with `correlationId`
4. Consumer persists event to `EventAudit`
5. Logs go to stdout → Filebeat → Elasticsearch → Kibana

## Kafka topics

- `notes.created`
- `notes.updated`
- `notes.deleted`
- `forms.submitted`

## Environment contract

| Variable | Used by | Example |
|----------|---------|---------|
| `DATABASE_URL` | api, consumer | `postgresql://notes:notes@localhost:5433/notes` |
| `KAFKA_BROKERS` | api, consumer | `localhost:9093` |
| `JWT_SECRET` | api | random string |
| `VITE_API_URL` | web | `http://localhost:3000` |
