import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/current-user.decorator';
import type { JwtPayload } from '../auth/jwt.strategy';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { EntryLogPublicResponseDto } from '../entry-logs/dto/entry-log-public-response.dto';
import { RegisterEntryDto } from '../entry-logs/dto/register-entry.dto';
import { EntryLogsService } from '../entry-logs/entry-logs.service';
import { UpdateUserDto } from '../users/dto/update-user.dto';
import { CoachesService } from './coaches.service';

@ApiTags('coaches')
@ApiBearerAuth()
@Controller('coaches')
@UseGuards(RolesGuard)
@Roles(UserRole.owner, UserRole.coach)
export class CoachesController {
  constructor(
    private readonly coachesService: CoachesService,
    private readonly entryLogsService: EntryLogsService,
  ) {}

  @Post('entry-logs')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a customer entry by user number' })
  @ApiResponse({ status: 201, type: EntryLogPublicResponseDto })
  @ApiResponse({ status: 404, description: 'User not found' })
  registerEntry(
    @CurrentUser() user: JwtPayload,
    @Body() dto: RegisterEntryDto,
  ) {
    return this.entryLogsService.registerByUserNumber(
      user.id_account,
      dto.user_number,
    );
  }

  @Get()
  findAll(@CurrentUser() user: JwtPayload) {
    return this.coachesService.findAll(user.id_account);
  }

  @Get(':id')
  findOne(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.coachesService.findOne(id, user.id_account);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserDto,
  ) {
    return this.coachesService.update(id, user.id_account, dto);
  }

  @Delete(':id')
  remove(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.coachesService.remove(id, user.id_account);
  }
}
