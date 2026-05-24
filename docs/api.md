# API quick start

Swagger UI: http://localhost:3000/api/docs

## Register

```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"user@example.com","password":"secret123"}'
```

## Login

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"user@example.com","password":"secret123"}'
```

## Create note

```bash
TOKEN=<accessToken>
curl -X POST http://localhost:3000/api/v1/notes \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -H 'X-Correlation-Id: demo-123' \
  -d '{"title":"Hello","body":"World","tags":["demo"]}'
```

## Submit form

```bash
curl -X POST http://localhost:3000/api/v1/forms/<formId>/submit \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"data":{"email":"a@b.com","message":"Hi"}}'
```
