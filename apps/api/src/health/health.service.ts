import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kafka, logLevel } from 'kafkajs';
import { PrismaService } from '../common/prisma/prisma.service';

export type CheckStatus = 'up' | 'down';

export interface DependencyCheck {
  status: CheckStatus;
  latencyMs?: number;
  error?: string;
}

export interface HealthReport {
  status: 'ok' | 'degraded' | 'error';
  service: string;
  timestamp: string;
  checks: {
    postgres: DependencyCheck;
    kafka: DependencyCheck;
  };
}

@Injectable()
export class HealthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async getReport(): Promise<HealthReport> {
    const [postgres, kafka] = await Promise.all([
      this.checkPostgres(),
      this.checkKafka(),
    ]);

    let status: HealthReport['status'] = 'ok';
    if (postgres.status === 'down') {
      status = 'error';
    } else if (kafka.status === 'down') {
      status = 'degraded';
    }

    return {
      status,
      service: 'notes-api',
      timestamp: new Date().toISOString(),
      checks: { postgres, kafka },
    };
  }

  isReady(report: HealthReport): boolean {
    return report.checks.postgres.status === 'up';
  }

  private async checkPostgres(): Promise<DependencyCheck> {
    const started = Date.now();
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'up', latencyMs: Date.now() - started };
    } catch (error) {
      return {
        status: 'down',
        latencyMs: Date.now() - started,
        error: (error as Error).message,
      };
    }
  }

  private async checkKafka(): Promise<DependencyCheck> {
    const brokers = this.config.get<string>('KAFKA_BROKERS', 'localhost:9093');
    const started = Date.now();
    const kafka = new Kafka({
      clientId: 'notes-api-health',
      brokers: brokers.split(','),
      logLevel: logLevel.NOTHING,
      connectionTimeout: 3000,
      requestTimeout: 3000,
    });
    const admin = kafka.admin();

    try {
      await admin.connect();
      await admin.listTopics();
      return { status: 'up', latencyMs: Date.now() - started };
    } catch (error) {
      return {
        status: 'down',
        latencyMs: Date.now() - started,
        error: (error as Error).message,
      };
    } finally {
      await admin.disconnect().catch(() => undefined);
    }
  }
}
