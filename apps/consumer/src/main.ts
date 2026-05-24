import 'dotenv/config';
import { Kafka, logLevel } from 'kafkajs';
import { PrismaClient, Prisma } from '@prisma/client';
import pino from 'pino';
import { KAFKA_TOPICS } from '@notes/shared';

const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  base: { service: 'notes-consumer' },
});

const prisma = new PrismaClient();
const topics = Object.values(KAFKA_TOPICS);

async function main() {
  const brokers = (process.env.KAFKA_BROKERS ?? 'localhost:9093').split(',');
  const kafka = new Kafka({
    clientId: 'notes-consumer',
    brokers,
    logLevel: logLevel.ERROR,
  });

  const consumer = kafka.consumer({ groupId: 'notes-consumer-group' });
  await consumer.connect();
  for (const topic of topics) {
    await consumer.subscribe({ topic, fromBeginning: false });
  }

  logger.info({ topics, brokers }, 'Consumer started');

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      const raw = message.value?.toString() ?? '{}';
      let payload: Record<string, unknown> = {};
      try {
        payload = JSON.parse(raw) as Record<string, unknown>;
      } catch {
        payload = { raw };
      }

      const correlationId =
        typeof payload.correlationId === 'string'
          ? payload.correlationId
          : undefined;

      await prisma.eventAudit.create({
        data: {
          topic,
          payload: payload as Prisma.InputJsonValue,
          correlationId,
        },
      });

      logger.info({
        topic,
        partition,
        offset: message.offset,
        correlationId,
      }, 'Event processed');
    },
  });
}

main().catch((error) => {
  logger.error(error, 'Consumer failed');
  process.exit(1);
});
