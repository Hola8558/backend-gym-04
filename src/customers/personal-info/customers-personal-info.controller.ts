import { Body, Controller, Get, Patch } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../../auth/current-user.decorator';
import type { JwtPayload } from '../../auth/jwt.strategy';
import { CustomersPersonalInfoService } from './customers-personal-info.service';
import { PersonalInfoResponseDto } from './dto/personal-info-response.dto';
import { UpdatePersonalInfoDto } from './dto/update-personal-info.dto';

@ApiTags('customers / personal-info')
@ApiBearerAuth()
@Controller(['customer/personal-info', 'customers/personal-info'])
export class CustomersPersonalInfoController {
  constructor(
    private readonly personalInfoService: CustomersPersonalInfoService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get lightweight customer profile' })
  @ApiOkResponse({ type: PersonalInfoResponseDto })
  getPersonalInfo(
    @CurrentUser() user: JwtPayload,
  ): Promise<PersonalInfoResponseDto> {
    return this.personalInfoService.getPersonalInfo(user.sub, user.id_account);
  }

  @Patch()
  @ApiOperation({ summary: 'Partially update customer personal info' })
  @ApiOkResponse({ type: PersonalInfoResponseDto })
  updatePersonalInfo(
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdatePersonalInfoDto,
  ): Promise<PersonalInfoResponseDto> {
    return this.personalInfoService.updatePersonalInfo(
      user.sub,
      user.id_account,
      dto,
    );
  }
}
