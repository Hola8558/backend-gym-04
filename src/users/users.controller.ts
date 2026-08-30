import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { JwtPayload } from '../auth/jwt.strategy';
import { RequireFeature } from '../common/decorators/require-feature.decorator';
import { FeatureGuard } from '../common/guards/feature.guard';
import { CreateCustomerUserDto } from './dto/create-customer-user.dto';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll() {
    return { data: [], placeholder: true };
  }

  @Post()
  @UseGuards(JwtAuthGuard, FeatureGuard)
  @RequireFeature(5005, 5004)
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateCustomerUserDto) {
    return this.usersService.createUserWithProfile(
      {
        ...dto,
        role: UserRole.customer,
      },
      user.id_account,
      user.sub,
    );
  }
}
