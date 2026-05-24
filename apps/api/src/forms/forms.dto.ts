import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsObject,
  IsOptional,
  IsString,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { FormFieldType } from '@notes/shared';

export class FormFieldDto {
  @ApiProperty({ example: 'name' })
  @IsString()
  @MinLength(1)
  name!: string;

  @ApiProperty({ example: 'Your name' })
  @IsString()
  @MinLength(1)
  label!: string;

  @ApiProperty({ enum: ['text', 'email', 'textarea'] })
  @IsIn(['text', 'email', 'textarea'])
  type!: FormFieldType;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  required?: boolean;
}

export class CreateFormDto {
  @ApiProperty({ example: 'Contact form' })
  @IsString()
  @MinLength(1)
  title!: string;

  @ApiProperty({ type: [FormFieldDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FormFieldDto)
  schema!: FormFieldDto[];
}

export class SubmitFormDto {
  @ApiProperty({
    example: { name: 'John', email: 'john@example.com', message: 'Hello' },
  })
  @IsObject()
  data!: Record<string, string>;
}

export class FormResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  userId!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty({ type: [FormFieldDto] })
  schema!: FormFieldDto[];

  @ApiProperty()
  createdAt!: Date;
}

export class FormSubmissionResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  formId!: string;

  @ApiProperty()
  data!: Record<string, string>;

  @ApiProperty()
  createdAt!: Date;
}
