import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/current-user.decorator';
import type { JwtPayload } from '../auth/jwt.strategy';
import { RequireFeature } from '../common/decorators/require-feature.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { FeatureGuard } from '../common/guards/feature.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CreateMembershipTypeDto } from '../membership-types/dto/create-membership-type.dto';
import { MembershipTypeResponseDto } from '../membership-types/dto/membership-type-response.dto';
import { MembershipTypesService } from '../membership-types/membership-types.service';
import { CreateMembershipDto } from './dto/create-membership.dto';

@ApiTags('memberships')
@ApiBearerAuth()
@UseGuards(RolesGuard, FeatureGuard)
@Roles(UserRole.owner, UserRole.solo_coach)
@RequireFeature(5006)
@Controller('memberships')
export class MembershipsController {
  constructor(private readonly membershipTypesService: MembershipTypesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a membership plan' })
  @ApiResponse({ status: 201, type: MembershipTypeResponseDto })
  create(@CurrentUser() user: JwtPayload, @Body() body: CreateMembershipDto) {
    const mapped: CreateMembershipTypeDto = {
      name: body.name,
      price: body.price,
      duration_days: body.durationDays,
      features: body.features,
    };
    return this.membershipTypesService.create(user.id_account, mapped);
  }

  @Get()
  @ApiOperation({ summary: 'List membership plans for current account' })
  @ApiResponse({ status: 200, type: MembershipTypeResponseDto, isArray: true })
  findAll(
    @CurrentUser() user: JwtPayload,
    @Query('status') status?: string,
  ) {
    return this.membershipTypesService.findAll(user.id_account, status);
  }
}
