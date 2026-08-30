import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { JwtPayload } from '../auth/jwt.strategy';
import { RequireFeature } from '../common/decorators/require-feature.decorator';
import { FeatureGuard } from '../common/guards/feature.guard';
import { CreateRoutineDto } from './dto/create-routine.dto';
import { RoutinePlanResponseDto } from './dto/routine-plan-response.dto';
import { RoutineSaveResponseDto } from './dto/routine-save-response.dto';
import { RoutinesService } from './routines.service';

@ApiTags('routines')
@ApiBearerAuth()
@UseGuards(FeatureGuard)
@RequireFeature(5011, 5012)
@Controller('routines')
export class RoutinesController {
  constructor(private readonly routinesService: RoutinesService) {}

  @Get('plan')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get active routine plan JSON for a customer (same account)' })
  @ApiResponse({ status: 200, type: RoutinePlanResponseDto })
  @ApiResponse({ status: 404, description: 'Customer or plan not found' })
  findPlan(
    @CurrentUser() user: JwtPayload,
    @Query('id_user', ParseIntPipe) id_user: number,
  ) {
    return this.routinesService.findPlanForCustomer(user.id_account, id_user);
  }

  @Get('client/:id_user')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get active weekly routine records for a customer' })
  @ApiResponse({ status: 200, type: RoutinePlanResponseDto, isArray: true })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  findByClient(
    @CurrentUser() user: JwtPayload,
    @Param('id_user', ParseIntPipe) idUser: number,
  ) {
    return this.routinesService.findRoutinesForCustomer(user.id_account, idUser);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create or update a weekly routine for a customer' })
  @ApiResponse({ status: 201, type: RoutineSaveResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  create(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateRoutineDto,
  ) {
    return this.routinesService.createOrUpdate(user.id_account, dto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update a weekly routine for a customer' })
  @ApiResponse({ status: 200, type: RoutineSaveResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Not found' })
  update(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) idRoutine: number,
    @Body() dto: CreateRoutineDto,
  ) {
    return this.routinesService.updateById(user.id_account, idRoutine, dto);
  }
}
