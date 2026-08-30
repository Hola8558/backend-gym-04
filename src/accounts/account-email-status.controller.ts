import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../auth/public.decorator';
import { AccountsService } from './accounts.service';
import { EmailStatusValidationDto } from './dto/email-status-validation.dto';
import { EmailStatusValidationResponseDto } from './dto/email-status-validation-response.dto';
import { EmailStatusOriginGuard } from './guards/email-status-origin.guard';

@ApiTags('account')
@Controller('account')
export class AccountEmailStatusController {
  constructor(private readonly accountsService: AccountsService) {}

  @Public()
  @Post('email-status-validation')
  @HttpCode(HttpStatus.OK)
  @UseGuards(EmailStatusOriginGuard)
  @ApiOperation({ summary: 'Public email lookup for account and Stripe portal status' })
  @ApiOkResponse({ type: EmailStatusValidationResponseDto })
  validateEmailStatus(
    @Body() dto: EmailStatusValidationDto,
  ): Promise<EmailStatusValidationResponseDto> {
    return this.accountsService.validateEmailStatus(dto.email);
  }
}
