import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kafka, Producer, logLevel } from 'kafkajs';
import { KafkaTopic, KAFKA_TOPICS } from '@notes/shared';

@Injectable()
export class KafkaService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KafkaService.name);
  private producer!: Producer;
  private enabled = true;

  constructor(private readonly config: ConfigService) {}

  async onModuleInit() {
    const brokers = this.config.get<string>('KAFKA_BROKERS', 'localhost:9093');
    const kafka = new Kafka({
      clientId: 'notes-api',
      brokers: brokers.split(','),
      logLevel: logLevel.ERROR,
      retry: { retries: 10, initialRetryTime: 3000 },
    });
    this.producer = kafka.producer();
    try {
      await this.ensureTopics(kafka);
      await this.producer.connect();
      this.logger.log(`Kafka producer connected to ${brokers}`);
    } catch (error) {
      this.enabled = false;
      this.logger.warn(
        `Kafka unavailable, events will be skipped: ${(error as Error).message}`,
      );
    }
  }

  private async ensureTopics(kafka: Kafka) {
    const admin = kafka.admin();
    await admin.connect();
    try {
      const topicNames = Object.values(KAFKA_TOPICS);
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
        this.logger.log(`Created Kafka topics: ${missing.join(', ')}`);
      }
    } finally {
      await admin.disconnect();
    }
  }

  async onModuleDestroy() {
    if (this.enabled) {
      await this.producer.disconnect();
    }
  }

  async publish(
    topic: KafkaTopic,
    payload: Record<string, unknown>,
    correlationId?: string,
  ) {
    if (!this.enabled) {
      return;
    }
    try {
      await this.producer.send({
        topic,
        messages: [
          {
            value: JSON.stringify({
              ...payload,
              correlationId,
              publishedAt: new Date().toISOString(),
            }),
          },
        ],
      });
    } catch (error) {
      this.logger.error(
        `Failed to publish to ${topic}: ${(error as Error).message}`,
      );
    }
  }
}
