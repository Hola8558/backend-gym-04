import { Body, Controller, Get, HttpCode, HttpStatus, Patch, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { JwtPayload } from '../auth/jwt.strategy';
import { PasswordService } from '../password/password.service';
import { ChangeProfilePasswordResponseDto } from './dto/change-profile-password-response.dto';
import { ProfileResponseDto } from './dto/profile-response.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ProfilesService } from './profiles.service';

@ApiTags('profiles')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('profiles')
export class ProfilesController {
  constructor(
    private readonly profilesService: ProfilesService,
    private readonly passwordService: PasswordService,
  ) {}

  @Get('me')
  @ApiOperation({ summary: 'Get the authenticated user profile' })
  @ApiResponse({ status: 200, type: ProfileResponseDto })
  getMe(@CurrentUser() user: JwtPayload) {
    return this.profilesService.getCurrentProfile(user.sub, user.id_account);
  }

  @Patch('me')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update the authenticated user profile' })
  @ApiResponse({ status: 200, type: ProfileResponseDto })
  updateMe(@CurrentUser() user: JwtPayload, @Body() dto: UpdateProfileDto) {
    return this.profilesService.updateCurrentProfile(
      user.sub,
      user.id_account,
      user.role,
      dto,
    );
  }

  @Patch('password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Change the authenticated user password' })
  @ApiResponse({ status: 200, type: ChangeProfilePasswordResponseDto })
  async changePassword(
    @CurrentUser() user: JwtPayload,
    @Body('password') password: string,
  ): Promise<ChangeProfilePasswordResponseDto> {
    await this.passwordService.updateUserPassword(
      user.sub,
      user.id_account,
      password,
    );
    return { message: 'PROFILE.CHANGE_PASSWORD.SUCCESS' };
  }

  @Get()
  findAll() {
    return { data: [], placeholder: true };
  }

  @Post()
  create(@Body() _body: unknown) {
    return { accepted: true, placeholder: true };
  }
}
