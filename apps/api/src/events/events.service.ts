import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class EventsService {
  constructor(private readonly prisma: PrismaService) {}

  findForUser(userId: string, limit = 50) {
    return this.prisma.eventAudit.findMany({
      where: {
        payload: {
          path: ['userId'],
          equals: userId,
        },
      },
      orderBy: { processedAt: 'desc' },
      take: limit,
    });
  }
}
