import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseEnumPipe,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { JwtPayload } from '../auth/jwt.strategy';
import { RequireAccess } from '../common/decorators/require-access.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { AccessGuard } from '../common/guards/access.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { EntryLogPublicResponseDto } from '../entry-logs/dto/entry-log-public-response.dto';
import { RegisterEntryDto } from '../entry-logs/dto/register-entry.dto';
import { EntryLogsService } from '../entry-logs/entry-logs.service';
import { CreateCoachDto } from './dto/create-coach.dto';
import { UpdateCoachDto } from './dto/update-coach.dto';
import { CoachListStatus } from './dto/coach-list-status.query';
import { AssignedCustomerRowDto } from './dto/assigned-customer-row.dto';
import { CoachesService } from './coaches.service';

@ApiTags('coaches')
@ApiBearerAuth()
@Controller('coaches')
export class CoachesController {
  constructor(
    private readonly coachesService: CoachesService,
    private readonly entryLogsService: EntryLogsService,
  ) {}

  @Post('entry-logs')
  @UseGuards(JwtAuthGuard, AccessGuard)
  @RequireAccess({ features: ['5001'] })
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
  @UseGuards(RolesGuard)
  @Roles(UserRole.owner, UserRole.coach, UserRole.solo_coach)
  @ApiOperation({ summary: 'List coaches by status (default ACTIVE)' })
  findAll(
    @CurrentUser() user: JwtPayload,
    @Query(
      'status',
      new DefaultValuePipe(CoachListStatus.ACTIVE),
      new ParseEnumPipe(CoachListStatus),
    )
    listStatus: CoachListStatus,
  ) {
    return this.coachesService.findAll(user.id_account, listStatus, user);
  }

  @Post()
  @UseGuards(JwtAuthGuard, AccessGuard)
  @RequireAccess({ features: ['5000'], roles: ['owner'] })
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a coach in the current account' })
  create(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateCoachDto,
  ) {
    return this.coachesService.create(user.id_account, user.sub, dto);
  }

  @Get(':id/customers')
  @UseGuards(JwtAuthGuard, AccessGuard)
  @RequireAccess({ features: ['5000'], roles: ['owner'] })
  @ApiOperation({ summary: 'List active customers assigned to this coach' })
  @ApiResponse({ status: 200, type: [AssignedCustomerRowDto] })
  getAssignedCustomers(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.coachesService.getAssignedCustomers(id, user.id_account);
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.owner, UserRole.coach, UserRole.solo_coach)
  findOne(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.coachesService.findOne(id, user.id_account, user);
  }

  @Patch(':id/recover')
  @UseGuards(JwtAuthGuard, AccessGuard)
  @RequireAccess({ features: ['5000'], roles: ['owner'] })
  @ApiOperation({ summary: 'Restore a soft-deleted coach' })
  @HttpCode(HttpStatus.OK)
  recover(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.coachesService.recover(id, user.id_account);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, AccessGuard)
  @RequireAccess({ features: ['5000'], roles: ['owner'] })
  update(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCoachDto,
  ) {
    return this.coachesService.update(id, user.id_account, dto, user);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, AccessGuard)
  @RequireAccess({ features: ['5000'] })
  remove(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.coachesService.remove(id, user.id_account, user.sub);
  }
}
