import { Body, Controller, Post } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/current-user.decorator';
import type { JwtPayload } from '../auth/jwt.strategy';
import { Public } from '../auth/public.decorator';
import { CreateRoutineDto } from './dto/create-routine.dto';
import { RoutineResponseDto } from './dto/routine-response.dto';
import { RoutinesService } from './routines.service';

@ApiTags('routines')
@ApiBearerAuth()
@Controller('routines')
export class RoutinesController {
  constructor(private readonly routinesService: RoutinesService) {}

  @Public()
  @Post()
  @ApiOperation({ summary: 'Create a routine as a guest or authenticated user' })
  @ApiResponse({ status: 201, type: RoutineResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'User not found in this account' })
  create(
    @Body() dto: CreateRoutineDto,
    @CurrentUser() user?: JwtPayload,
  ) {
    return this.routinesService.create(dto, user);
  }
}
