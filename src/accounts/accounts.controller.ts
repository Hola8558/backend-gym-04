import { Body, Controller, Get, Post } from '@nestjs/common';
import { Public } from '../auth/public.decorator';
import { AccountsService } from './accounts.service';
import { CreateAccountDto } from './dto/create-account.dto';

@Controller('accounts')
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Get()
  findAll() {
    return { data: [], placeholder: true };
  }

  @Public()
  @Post()
  create(@Body() dto: CreateAccountDto) {
    return this.accountsService.createAccountWithUser(dto);
  }
}
