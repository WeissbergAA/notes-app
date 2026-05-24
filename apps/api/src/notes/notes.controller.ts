import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthUser, CorrelationId, CurrentUser } from '../common/decorators';
import { CreateNoteDto, NoteResponseDto, UpdateNoteDto } from './notes.dto';
import { NotesService } from './notes.service';

@ApiTags('notes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notes')
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  @Get()
  @ApiOperation({ summary: 'List notes for current user' })
  findAll(@CurrentUser() user: AuthUser): Promise<NoteResponseDto[]> {
    return this.notesService.findAll(user.userId);
  }

  @Post()
  @ApiOperation({ summary: 'Create note' })
  create(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateNoteDto,
    @CorrelationId() correlationId: string,
  ): Promise<NoteResponseDto> {
    return this.notesService.create(user.userId, dto, correlationId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get note by id' })
  findOne(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
  ): Promise<NoteResponseDto> {
    return this.notesService.findOne(user.userId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update note' })
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateNoteDto,
    @CorrelationId() correlationId: string,
  ): Promise<NoteResponseDto> {
    return this.notesService.update(user.userId, id, dto, correlationId);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete note' })
  async remove(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @CorrelationId() correlationId: string,
  ): Promise<void> {
    await this.notesService.remove(user.userId, id, correlationId);
  }
}
