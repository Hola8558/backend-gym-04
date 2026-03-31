import { Body, Controller, Get, Post } from '@nestjs/common';
import { AccountsService } from './accounts.service';

@Controller('accounts')
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Get()
  findAll() {
    return { data: [], placeholder: true };
  }

  @Post()
  create(@Body() _body: unknown) {
    return { accepted: true, placeholder: true };
  }
}
