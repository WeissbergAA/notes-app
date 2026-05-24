import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { KAFKA_TOPICS, FormFieldSchema } from '@notes/shared';
import { PrismaService } from '../common/prisma/prisma.service';
import { KafkaService } from '../kafka/kafka.service';
import { CreateFormDto, SubmitFormDto } from './forms.dto';

@Injectable()
export class FormsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly kafka: KafkaService,
  ) {}

  findAll(userId: string) {
    return this.prisma.form.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(userId: string, id: string) {
    const form = await this.prisma.form.findFirst({ where: { id, userId } });
    if (!form) {
      throw new NotFoundException('Form not found');
    }
    return form;
  }

  create(userId: string, dto: CreateFormDto) {
    return this.prisma.form.create({
      data: {
        userId,
        title: dto.title,
        schema: dto.schema as unknown as Prisma.InputJsonValue,
      },
    });
  }

  async submit(
    userId: string,
    id: string,
    dto: SubmitFormDto,
    correlationId?: string,
  ) {
    const form = await this.findOne(userId, id);
    const schema = form.schema as unknown as FormFieldSchema[];
    this.validateSubmission(schema, dto.data);

    const submission = await this.prisma.formSubmission.create({
      data: { formId: id, data: dto.data },
    });

    await this.kafka.publish(
      KAFKA_TOPICS.FORMS_SUBMITTED,
      {
        formId: id,
        submissionId: submission.id,
        userId,
        data: dto.data,
      },
      correlationId,
    );

    return submission;
  }

  private validateSubmission(
    schema: FormFieldSchema[],
    data: Record<string, string>,
  ) {
    const errors: string[] = [];

    for (const field of schema) {
      const value = data[field.name];
      if (field.required && (!value || value.trim() === '')) {
        errors.push(`${field.name} is required`);
        continue;
      }
      if (value && field.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        errors.push(`${field.name} must be a valid email`);
      }
    }

    if (errors.length > 0) {
      throw new BadRequestException({ message: 'Validation failed', errors });
    }
  }
}
