import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Post,
} from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Public } from './public.decorator';
import { AuthService } from './auth.service';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { IdentifyDto } from './dto/identify.dto';
import { IdentifyResponseDto } from './dto/identify-response.dto';
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
  @Post('identify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Resolve an identifier before asking for a password',
  })
  @ApiOkResponse({ type: IdentifyResponseDto })
  @ApiResponse({ status: 401, description: 'Unknown identifier' })
  @ApiResponse({
    status: 409,
    description: 'Multiple active accounts for this email',
  })
  identify(@Body() dto: IdentifyDto): Promise<IdentifyResponseDto> {
    return this.auth.identify(dto.identifier);
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
    console.log('--- DIAGNOSTIC 1 (NEST): FORGOT PASSWORD REQUEST RECEIVED ---');
    console.log(`--- DIAGNOSTIC 2 (NEST): DTO = ${JSON.stringify(dto)} ---`);

    try {
      await this.auth.resetPassword(dto);
    } catch (error) {
      if (error instanceof NotFoundException) {
        console.log(
          '--- DIAGNOSTIC 9 (NEST): CONTROLLER SWALLOWED NotFoundException (user not found or no email). Returning generic success. ---',
        );
      } else {
        console.error(
          `--- DIAGNOSTIC 10 (NEST): CONTROLLER RE-THROWING ERROR = ${error instanceof Error ? error.message : String(error)} ---`,
        );
        throw error;
      }
    }

    return { message: 'AUTH.FORGOT_PASSWORD.SUCCESS' };
  }

  @Public()
  @Post('setup-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Set a new password when requires_password_change is true',
  })
  @ApiResponse({ status: 200, description: 'Returns a new JWT' })
  @ApiResponse({ status: 400, description: 'Weak password' })
  @ApiResponse({ status: 403, description: 'Password change not required' })
  setupPassword(@Body() dto: SetupPasswordDto) {
    return this.auth.setupPassword(dto.identifier, dto.newPassword);
  }
}
