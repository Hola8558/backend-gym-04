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
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/current-user.decorator';
import type { JwtPayload } from '../auth/jwt.strategy';
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
  @ApiOperation({ summary: 'Create a membership plan' })
  @ApiResponse({ status: 201, type: MembershipTypeResponseDto })
  create(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateMembershipTypeDto,
  ) {
    return this.membershipTypesService.create(user.id_account, dto);
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

  @Patch(':id')
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
  @ApiOperation({ summary: 'Soft-delete a membership plan' })
  @ApiResponse({ status: 200, type: MembershipTypeResponseDto })
  @ApiResponse({ status: 404, description: 'Not found' })
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
