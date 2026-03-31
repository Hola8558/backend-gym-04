import { Body, Controller, Get, Post } from '@nestjs/common';
import { ProfilesService } from './profiles.service';

@Controller('profiles')
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  @Get()
  findAll() {
    return { data: [], placeholder: true };
  }

  @Post()
  create(@Body() _body: unknown) {
    return { accepted: true, placeholder: true };
  }
}
