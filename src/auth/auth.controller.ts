import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Post,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from './current-user.decorator';
import type { JwtPayload } from './jwt.strategy';
import { Public } from './public.decorator';
import { AuthService } from './auth.service';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { SetupPasswordDto } from './dto/setup-password.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Post('login')
  @ApiOperation({ summary: 'Login with email or user number' })
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Request a temporary password by email or user number',
  })
  @ApiResponse({
    status: 200,
    description: 'Generic success (does not reveal whether the user exists)',
  })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    try {
      await this.auth.resetPassword(dto.identifier, dto.language);
    } catch (error) {
      if (!(error instanceof NotFoundException)) {
        throw error;
      }
    }

    return { message: 'AUTH.FORGOT_PASSWORD.SUCCESS' };
  }

  @Post('setup-password')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Set a new password after first login with a temporary password',
  })
  @ApiResponse({ status: 200, description: 'Returns a new JWT' })
  @ApiResponse({ status: 400, description: 'Weak password' })
  @ApiResponse({ status: 403, description: 'Password change not required' })
  setupPassword(
    @CurrentUser() user: JwtPayload,
    @Body() dto: SetupPasswordDto,
  ) {
    return this.auth.setupPassword(user.sub, dto.newPassword);
  }
}
