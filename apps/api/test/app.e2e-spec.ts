import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/common/prisma/prisma.service';

describe('Notes App (e2e)', () => {
  let app: INestApplication;
  let token = '';
  let noteId = '';
  let formId = '';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter(),
    );
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    const prisma = app.get(PrismaService);
    await prisma.formSubmission.deleteMany();
    await prisma.form.deleteMany();
    await prisma.note.deleteMany();
    await prisma.eventAudit.deleteMany();
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /health', () => {
    return request(app.getHttpServer())
      .get('/api/v1/health')
      .expect(200)
      .expect(({ body }) => {
        expect(body.status).toBe('ok');
      });
  });

  it('POST /auth/register + login + me', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email: 'e2e@test.com', password: 'secret123' })
      .expect(201);

    const login = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'e2e@test.com', password: 'secret123' })
      .expect(201);

    token = login.body.accessToken;

    await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.email).toBe('e2e@test.com');
      });
  });

  it('notes CRUD', async () => {
    const created = await request(app.getHttpServer())
      .post('/api/v1/notes')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Test note', body: 'Body', tags: ['e2e'] })
      .expect(201);

    noteId = created.body.id;

    await request(app.getHttpServer())
      .get('/api/v1/notes')
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.length).toBeGreaterThan(0);
      });

    await request(app.getHttpServer())
      .patch(`/api/v1/notes/${noteId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Updated' })
      .expect(200);

    await request(app.getHttpServer())
      .delete(`/api/v1/notes/${noteId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(204);
  });

  it('forms create + submit validation', async () => {
    const form = await request(app.getHttpServer())
      .post('/api/v1/forms')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Feedback',
        schema: [
          { name: 'email', label: 'Email', type: 'email', required: true },
          { name: 'message', label: 'Message', type: 'textarea' },
        ],
      })
      .expect(201);

    formId = form.body.id;

    await request(app.getHttpServer())
      .post(`/api/v1/forms/${formId}/submit`)
      .set('Authorization', `Bearer ${token}`)
      .send({ data: { email: 'bad', message: 'Hi' } })
      .expect(400);

    await request(app.getHttpServer())
      .post(`/api/v1/forms/${formId}/submit`)
      .set('Authorization', `Bearer ${token}`)
      .send({ data: { email: 'ok@test.com', message: 'Hi' } })
      .expect(201);
  });

  it('returns 401 without token', () => {
    return request(app.getHttpServer()).get('/api/v1/notes').expect(401);
  });

  it('GET /events/audit', () => {
    return request(app.getHttpServer())
      .get('/api/v1/events/audit')
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
      .expect(({ body }) => {
        expect(Array.isArray(body)).toBe(true);
      });
  });
});
