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
import { CurrentUser } from '../auth/current-user.decorator';
import type { JwtPayload } from '../auth/jwt.strategy';
import { CreateMembershipTypeDto } from './dto/create-membership-type.dto';
import { UpdateMembershipTypeDto } from './dto/update-membership-type.dto';
import { MembershipTypesService } from './membership-types.service';

@Controller('membership-types')
export class MembershipTypesController {
  constructor(private readonly membershipTypesService: MembershipTypesService) {}

  @Post()
  create(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateMembershipTypeDto,
  ) {
    return this.membershipTypesService.create(user.id_account, dto);
  }

  @Get()
  findAll(
    @CurrentUser() user: JwtPayload,
    @Query('status') status?: string,
  ) {
    return this.membershipTypesService.findAll(user.id_account, status);
  }

  @Patch(':id')
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
