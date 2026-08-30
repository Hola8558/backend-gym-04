import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/current-user.decorator';
import type { JwtPayload } from '../auth/jwt.strategy';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { SendWhatsappDocumentDto } from './dto/send-whatsapp-document.dto';
import { SendWhatsappDocumentResponseDto } from './dto/send-whatsapp-document-response.dto';
import { UpdateWhatsappTemplatesDto } from './dto/update-whatsapp-templates.dto';
import { WhatsappQrResponseDto } from './dto/whatsapp-qr-response.dto';
import { WhatsappStatusResponseDto } from './dto/whatsapp-status-response.dto';
import { WhatsappTemplatesResponseDto } from './dto/whatsapp-templates-response.dto';
import { WhatsappService } from './whatsapp.service';

@ApiTags('whatsapp')
@ApiBearerAuth()
@Controller('whatsapp')
@UseGuards(RolesGuard)
export class WhatsappController {
  constructor(private readonly whatsappService: WhatsappService) {}

  @Get('status')
  @Roles(UserRole.owner, UserRole.solo_coach, UserRole.coach)
  @ApiOperation({ summary: 'Get WhatsApp session status for the current account' })
  @ApiResponse({ status: 200, type: WhatsappStatusResponseDto })
  getStatus(@CurrentUser() user: JwtPayload): Promise<WhatsappStatusResponseDto> {
    return this.whatsappService.getStatus(user.id_account);
  }

  @Post('generate-qr')
  @Roles(UserRole.owner, UserRole.solo_coach)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Create or reuse wsp identifier and return a linking QR (Base64)',
  })
  @ApiResponse({ status: 200, type: WhatsappQrResponseDto })
  generateQr(@CurrentUser() user: JwtPayload): Promise<WhatsappQrResponseDto> {
    return this.whatsappService.generateQr(user.id_account);
  }

  @Get('templates')
  @Roles(UserRole.owner, UserRole.solo_coach, UserRole.coach)
  @ApiOperation({
    summary: 'Get WhatsApp caption templates for the current account',
  })
  @ApiResponse({ status: 200, type: WhatsappTemplatesResponseDto })
  getTemplates(
    @CurrentUser() user: JwtPayload,
  ): Promise<WhatsappTemplatesResponseDto> {
    return this.whatsappService.getTemplates(user.id_account);
  }

  @Patch('templates')
  @Roles(UserRole.owner, UserRole.solo_coach)
  @ApiOperation({
    summary: 'Save WhatsApp caption templates for the current account',
  })
  @ApiResponse({ status: 200, type: WhatsappTemplatesResponseDto })
  updateTemplates(
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateWhatsappTemplatesDto,
  ): Promise<WhatsappTemplatesResponseDto> {
    return this.whatsappService.updateTemplates(user.id_account, dto);
  }

  @Post('send-document')
  @Roles(UserRole.owner, UserRole.solo_coach, UserRole.coach)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Send a PDF document through the account WhatsApp session',
  })
  @ApiResponse({ status: 200, type: SendWhatsappDocumentResponseDto })
  sendDocument(
    @CurrentUser() user: JwtPayload,
    @Body() dto: SendWhatsappDocumentDto,
  ): Promise<SendWhatsappDocumentResponseDto> {
    return this.whatsappService.sendDocument(user.id_account, dto);
  }
}
