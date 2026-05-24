import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthUser, CorrelationId, CurrentUser } from '../common/decorators';
import {
  CreateFormDto,
  SubmitFormDto,
} from './forms.dto';
import { FormsService } from './forms.service';

@ApiTags('forms')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('forms')
export class FormsController {
  constructor(private readonly formsService: FormsService) {}

  @Get()
  @ApiOperation({ summary: 'List forms for current user' })
  findAll(@CurrentUser() user: AuthUser) {
    return this.formsService.findAll(user.userId);
  }

  @Post()
  @ApiOperation({ summary: 'Create form' })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateFormDto) {
    return this.formsService.create(user.userId, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get form by id' })
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.formsService.findOne(user.userId, id);
  }

  @Post(':id/submit')
  @ApiOperation({ summary: 'Submit form response' })
  submit(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: SubmitFormDto,
    @CorrelationId() correlationId: string,
  ) {
    return this.formsService.submit(user.userId, id, dto, correlationId);
  }
}
