import { Body, Controller, Get, Post } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll() {
    return { data: [], placeholder: true };
  }

  @Post()
  create(@Body() _body: unknown) {
    return { accepted: true, placeholder: true };
  }
}
