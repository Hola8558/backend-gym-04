import { Controller, Get } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/current-user.decorator';
import type { JwtPayload } from '../auth/jwt.strategy';
import { CrowdmeterResponseDto } from './dto/crowdmeter-response.dto';
import { CrowdmeterService } from './crowdmeter.service';

@ApiTags('crowdmeter')
@ApiBearerAuth()
@Controller()
export class CrowdmeterController {
  constructor(private readonly crowdmeterService: CrowdmeterService) {}

  @Get('crowdmeter')
  @ApiOperation({ summary: 'List crowdmeter data for current account' })
  @ApiResponse({ status: 200, type: CrowdmeterResponseDto, isArray: true })
  findAll(@CurrentUser() user: JwtPayload) {
    return this.crowdmeterService.findAllForAccount(user.id_account);
  }

  @Get('crowdmeter/now')
  @ApiOperation({ summary: 'Get live crowdmeter data for current account' })
  @ApiResponse({
    status: 200,
    schema: {
      type: 'object',
      additionalProperties: { type: 'number' },
      example: { '10pm': 42 },
      nullable: true,
    },
  })
  findNow(@CurrentUser() user: JwtPayload) {
    return this.crowdmeterService.findNowForAccount(user.id_account);
  }
}
