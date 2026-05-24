import { Controller, Get, HttpCode, HttpStatus, Res } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { FastifyReply } from 'fastify';
import { HealthService } from './health.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly health: HealthService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Liveness — API process is running' })
  liveness() {
    return { status: 'ok', service: 'notes-api' };
  }

  @Get('ready')
  @ApiOperation({
    summary: 'Readiness — Postgres + Kafka connectivity (503 if Postgres down)',
  })
  async readiness(@Res() reply: FastifyReply) {
    const report = await this.health.getReport();
    const code = this.health.isReady(report)
      ? HttpStatus.OK
      : HttpStatus.SERVICE_UNAVAILABLE;
    return reply.status(code).send(report);
  }
}
