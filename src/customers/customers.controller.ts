import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Query,
} from '@nestjs/common';
import { ApiOkResponse } from '@nestjs/swagger';
import { CurrentUser } from '../auth/current-user.decorator';
import type { JwtPayload } from '../auth/jwt.strategy';
import { UpdateUserDto } from '../users/dto/update-user.dto';
import { CustomerResponseDto } from './dto/customer-response.dto';
import { CustomersService } from './customers.service';

@Controller(['customer', 'customers'])
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  findAll(
    @CurrentUser() user: JwtPayload,
    @Query('page') page = '1',
    @Query('limit') limit = '50',
    @Query('search') search = '',
  ) {
    return this.customersService.findAll(
      user.id_account,
      Number(page),
      Number(limit),
      search,
    );
  }

  @Get('search')
  search(
    @CurrentUser() user: JwtPayload,
    @Query('q') query = '',
    @Query('search') search = '',
    @Query('page') page = '1',
    @Query('limit') limit = '50',
  ) {
    return this.customersService.searchCustomers(
      search || query,
      user.id_account,
      Number(page),
      Number(limit),
    );
  }

  @Get(':id')
  @ApiOkResponse({ type: CustomerResponseDto })
  findOne(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.customersService.findOne(id, user.id_account);
  }

  @Patch(':id')
  @ApiOkResponse({ type: CustomerResponseDto })
  update(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserDto,
  ) {
    return this.customersService.update(id, user.id_account, dto);
  }

  @Delete(':id')
  remove(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.customersService.remove(id, user.id_account, user.sub);
  }
}
