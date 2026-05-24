import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kafka, Producer, logLevel } from 'kafkajs';
import { KafkaTopic } from '@notes/shared';

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
    });
    this.producer = kafka.producer();
    try {
      await this.producer.connect();
      this.logger.log(`Kafka producer connected to ${brokers}`);
    } catch (error) {
      this.enabled = false;
      this.logger.warn(
        `Kafka unavailable, events will be skipped: ${(error as Error).message}`,
      );
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
