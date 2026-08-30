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
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/current-user.decorator';
import type { JwtPayload } from '../auth/jwt.strategy';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { CustomerMenusService } from './customer-menus.service';
import { CreateCustomerMenuDto } from './dto/create-customer-menu.dto';
import { CustomerMenuCountResponseDto } from './dto/customer-menu-count-response.dto';
import { CustomerMenuResponseDto } from './dto/customer-menu-response.dto';
import { DeleteCustomerMenuResponseDto } from './dto/delete-customer-menu-response.dto';
import { UpdateCustomerMenuDto } from './dto/update-customer-menu.dto';

@ApiTags('customer-menus')
@ApiBearerAuth()
@Controller('customer-menus')
@UseGuards(RolesGuard)
export class CustomerMenusController {
  constructor(private readonly customerMenusService: CustomerMenusService) {}

  @Get('counts')
  @Roles(UserRole.coach, UserRole.owner, UserRole.solo_coach)
  @ApiOperation({
    summary:
      'Active (non-deleted) customer menu counts per customer in the account',
  })
  @ApiResponse({ status: 200, type: CustomerMenuCountResponseDto, isArray: true })
  findCounts(@CurrentUser() user: JwtPayload) {
    return this.customerMenusService.findCountsForAccount(user.id_account);
  }

  /**
   * Staff list path (not `/`) so Flutter `GET /customer-menus` can serve the
   * mobile active-menu viewer without hitting RolesGuard(owner/coach).
   */
  @Get('by-user')
  @Roles(UserRole.coach, UserRole.owner, UserRole.solo_coach)
  @ApiOperation({
    summary: 'List non-deleted menus for a customer (newest first)',
  })
  @ApiQuery({ name: 'id_user', required: true, type: Number })
  @ApiResponse({ status: 200, type: CustomerMenuResponseDto, isArray: true })
  findAll(
    @CurrentUser() user: JwtPayload,
    @Query('id_user', ParseIntPipe) idUser: number,
  ) {
    return this.customerMenusService.findAllForCustomer(
      user.id_account,
      idUser,
    );
  }

  @Get(':id_menu')
  @Roles(UserRole.coach, UserRole.owner, UserRole.solo_coach)
  @ApiOperation({ summary: 'Get one customer menu by id (tenant-scoped)' })
  @ApiResponse({ status: 200, type: CustomerMenuResponseDto })
  findOne(
    @CurrentUser() user: JwtPayload,
    @Param('id_menu', ParseIntPipe) idMenu: number,
  ) {
    return this.customerMenusService.findOne(user.id_account, idMenu);
  }

  @Post()
  @Roles(UserRole.coach, UserRole.owner, UserRole.solo_coach)
  @ApiOperation({ summary: 'Create an active customer menu' })
  @ApiResponse({ status: 201, type: CustomerMenuResponseDto })
  create(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateCustomerMenuDto,
  ) {
    return this.customerMenusService.create(user.id_account, dto);
  }

  @Patch(':id_menu')
  @Roles(UserRole.coach, UserRole.owner, UserRole.solo_coach)
  @ApiOperation({ summary: 'Update customer menu data' })
  @ApiResponse({ status: 200, type: CustomerMenuResponseDto })
  update(
    @CurrentUser() user: JwtPayload,
    @Param('id_menu', ParseIntPipe) idMenu: number,
    @Body() dto: UpdateCustomerMenuDto,
  ) {
    return this.customerMenusService.update(user.id_account, idMenu, dto);
  }

  @Delete(':id_menu')
  @Roles(UserRole.coach, UserRole.owner, UserRole.solo_coach)
  @ApiOperation({ summary: 'Soft-delete a customer menu (status=deleted)' })
  @ApiResponse({ status: 200, type: DeleteCustomerMenuResponseDto })
  remove(
    @CurrentUser() user: JwtPayload,
    @Param('id_menu', ParseIntPipe) idMenu: number,
  ) {
    return this.customerMenusService.softDelete(user.id_account, idMenu);
  }
}
