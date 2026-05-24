import 'dotenv/config';
import { Kafka, logLevel } from 'kafkajs';
import { PrismaClient, Prisma } from '@prisma/client';
import pino from 'pino';
import { KAFKA_TOPICS, type KafkaTopic } from '@notes/shared';

const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  base: { service: 'notes-consumer' },
});

const prisma = new PrismaClient();
const topics: KafkaTopic[] = Object.values(KAFKA_TOPICS);

async function ensureTopics(kafka: Kafka, topicNames: string[]) {
  const admin = kafka.admin();
  await admin.connect();
  try {
    const existing = await admin.listTopics();
    const missing = topicNames.filter((topic) => !existing.includes(topic));
    if (missing.length > 0) {
      await admin.createTopics({
        topics: missing.map((topic) => ({
          topic,
          numPartitions: 1,
          replicationFactor: 1,
        })),
        waitForLeaders: true,
      });
      logger.info({ topics: missing }, 'Created Kafka topics');
    }
  } finally {
    await admin.disconnect();
  }
}

async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const brokers = (process.env.KAFKA_BROKERS ?? 'localhost:9093').split(',');
  const kafka = new Kafka({
    clientId: 'notes-consumer',
    brokers,
    logLevel: logLevel.ERROR,
    retry: { retries: 10, initialRetryTime: 3000 },
  });

  // Kafka может стартовать дольше API — подождём и создадим топики
  for (let attempt = 1; attempt <= 10; attempt += 1) {
    try {
      await ensureTopics(kafka, topics);
      break;
    } catch (error) {
      if (attempt === 10) {
        throw error;
      }
      logger.warn({ attempt, err: error }, 'Kafka not ready, retrying...');
      await sleep(3000);
    }
  }

  const consumer = kafka.consumer({ groupId: 'notes-consumer-group' });
  await consumer.connect();
  for (const topic of topics) {
    await consumer.subscribe({ topic, fromBeginning: false });
  }

  logger.info({ topics, brokers }, 'Consumer started');

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      const raw = message.value?.toString() ?? '{}';
      let payload: Record<string, unknown>;
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
          payload: payload as Prisma.JsonObject,
          correlationId,
        },
      });

      logger.info(
        {
          topic,
          partition,
          offset: message.offset,
          correlationId,
        },
        'Event processed',
      );
    },
  });
}

main().catch((error) => {
  logger.error(error, 'Consumer failed');
  process.exit(1);
});
