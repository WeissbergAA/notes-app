import { Injectable, NotFoundException } from '@nestjs/common';
import { KAFKA_TOPICS } from '@notes/shared';
import { PrismaService } from '../common/prisma/prisma.service';
import { KafkaService } from '../kafka/kafka.service';
import { CreateNoteDto, UpdateNoteDto } from './notes.dto';

@Injectable()
export class NotesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly kafka: KafkaService,
  ) {}

  findAll(userId: string) {
    return this.prisma.note.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findOne(userId: string, id: string) {
    const note = await this.prisma.note.findFirst({ where: { id, userId } });
    if (!note) {
      throw new NotFoundException('Note not found');
    }
    return note;
  }

  async create(userId: string, dto: CreateNoteDto, correlationId?: string) {
    const note = await this.prisma.note.create({
      data: {
        userId,
        title: dto.title,
        body: dto.body ?? '',
        tags: dto.tags ?? [],
      },
    });
    await this.kafka.publish(
      KAFKA_TOPICS.NOTES_CREATED,
      { id: note.id, userId, title: note.title },
      correlationId,
    );
    return note;
  }

  async update(
    userId: string,
    id: string,
    dto: UpdateNoteDto,
    correlationId?: string,
  ) {
    await this.findOne(userId, id);
    const note = await this.prisma.note.update({
      where: { id },
      data: dto,
    });
    await this.kafka.publish(
      KAFKA_TOPICS.NOTES_UPDATED,
      { id: note.id, userId, fields: dto },
      correlationId,
    );
    return note;
  }

  async remove(userId: string, id: string, correlationId?: string) {
    await this.findOne(userId, id);
    await this.prisma.note.delete({ where: { id } });
    await this.kafka.publish(
      KAFKA_TOPICS.NOTES_DELETED,
      { id, userId },
      correlationId,
    );
  }
}
