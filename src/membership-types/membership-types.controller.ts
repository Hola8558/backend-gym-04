import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
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
import { CreateMembershipTypeDto } from './dto/create-membership-type.dto';
import { MembershipTypeResponseDto } from './dto/membership-type-response.dto';
import { UpdateMembershipTypeDto } from './dto/update-membership-type.dto';
import { MembershipTypesService } from './membership-types.service';

@ApiTags('membership-types')
@ApiBearerAuth()
@Controller('membership-types')
export class MembershipTypesController {
  constructor(private readonly membershipTypesService: MembershipTypesService) {}

  @Post()
  @UseGuards(JwtAuthGuard, AccessGuard)
  @RequireAccess({ features: ['5006', '5007'] })
  @ApiOperation({ summary: 'Create a membership plan' })
  @ApiResponse({ status: 201, type: MembershipTypeResponseDto })
  create(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateMembershipTypeDto,
  ) {
    return this.membershipTypesService.create(user.id_account, dto);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.owner, UserRole.coach, UserRole.solo_coach)
  @ApiOperation({ summary: 'List membership plans for current account' })
  @ApiResponse({ status: 200, type: MembershipTypeResponseDto, isArray: true })
  findAll(
    @CurrentUser() user: JwtPayload,
    @Query('status') status?: string,
  ) {
    return this.membershipTypesService.findAll(user.id_account, status);
  }

  @Get(':id/can-delete')
  @UseGuards(RolesGuard)
  @Roles(UserRole.owner, UserRole.coach, UserRole.solo_coach)
  @ApiOperation({ summary: 'Check whether this membership plan can be deleted' })
  @ApiResponse({ status: 200, description: 'Safe to delete' })
  @ApiResponse({ status: 409, description: 'Active customers use this plan' })
  checkCanDelete(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) idMembershipType: number,
  ) {
    return this.membershipTypesService.canDelete(
      user.id_account,
      idMembershipType,
    );
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, AccessGuard)
  @RequireAccess({ features: ['5006', '5007'] })
  @ApiOperation({ summary: 'Update a membership plan' })
  @ApiResponse({ status: 200, type: MembershipTypeResponseDto })
  @ApiResponse({ status: 404, description: 'Not found' })
  update(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) idMembershipType: number,
    @Body() dto: UpdateMembershipTypeDto,
  ) {
    return this.membershipTypesService.update(
      user.id_account,
      idMembershipType,
      dto,
    );
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, AccessGuard)
  @RequireAccess({ features: ['5006', '5007'] })
  @ApiOperation({
    summary: 'Soft-delete a membership plan (sets status to inactive)',
  })
  @ApiResponse({ status: 200, type: MembershipTypeResponseDto })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 409, description: 'Active customers use this plan' })
  remove(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) idMembershipType: number,
  ) {
    return this.membershipTypesService.softDelete(
      user.id_account,
      idMembershipType,
    );
  }
}
