import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateNoteDto {
  @ApiProperty({ example: 'My first note' })
  @IsString()
  @MinLength(1)
  title!: string;

  @ApiPropertyOptional({ example: 'Note body text' })
  @IsOptional()
  @IsString()
  body?: string;

  @ApiPropertyOptional({ type: [String], example: ['personal'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

export class UpdateNoteDto extends PartialType(CreateNoteDto) {}

export class NoteResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  userId!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  body!: string;

  @ApiProperty({ type: [String] })
  tags!: string[];

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}
