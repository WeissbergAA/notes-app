# Deploy guide

## Local Docker (API)

Build and run API connected to `notes-net` from notes-infra:

```bash
docker build -f apps/api/Dockerfile -t notes-api:local .
docker run --rm -p 3000:3000 \
  --network notes-net \
  -e DATABASE_URL=postgresql://notes:notes@notes-postgres:5432/notes?schema=public \
  -e KAFKA_BROKERS=notes-kafka:9092 \
  -e JWT_SECRET=change-me \
  notes-api:local
```

## GitHub Environments

Create environments `dev` and `staging` in GitHub repo settings.

Suggested secrets:

- `DATABASE_URL`
- `JWT_SECRET`
- `KAFKA_BROKERS`

## GHCR (optional)

Push API image to GitHub Container Registry:

```bash
docker tag notes-api:local ghcr.io/weissbergaa/notes-api:v0.1.0
docker push ghcr.io/weissbergaa/notes-api:v0.1.0
```

## Release v0.1.0 checklist

- [ ] Infra up (`notes-infra`)
- [ ] Migrations applied
- [ ] API `/health` OK
- [ ] Swagger reachable
- [ ] Consumer writes to `EventAudit`
- [ ] Kibana index `notes-*` (full profile)
- [ ] CI green on `main`
