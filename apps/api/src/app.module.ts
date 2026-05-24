import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { randomUUID } from 'crypto';
import { PrismaModule } from './common/prisma/prisma.module';
import { KafkaModule } from './kafka/kafka.module';
import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module';
import { NotesModule } from './notes/notes.module';
import { EventsModule } from './events/events.module';
import { FormsModule } from './forms/forms.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.LOG_LEVEL ?? 'info',
        base: { service: 'notes-api' },
        genReqId: (req, res) => {
          const existing = req.headers['x-correlation-id'];
          const correlationId =
            typeof existing === 'string' && existing.length > 0
              ? existing
              : randomUUID();
          res.setHeader('x-correlation-id', correlationId);
          return correlationId;
        },
        customProps: (req) => ({
          correlationId: req.id,
        }),
        serializers: {
          req: (req) => ({
            method: req.method,
            url: req.url,
          }),
          res: (res) => ({
            statusCode: res.statusCode,
          }),
        },
      },
    }),
    PrismaModule,
    KafkaModule,
    HealthModule,
    AuthModule,
    NotesModule,
    FormsModule,
    EventsModule,
  ],
})
export class AppModule {}
