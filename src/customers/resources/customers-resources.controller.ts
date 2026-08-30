import { Controller, Get, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { CurrentUser } from '../../auth/current-user.decorator';
import type { JwtPayload } from '../../auth/jwt.strategy';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { ResourceCategoryResponseDto } from '../../resources/dto/resource-category-response.dto';
import { ResourcesService } from '../../resources/resources.service';

@ApiTags('customers / resources')
@ApiBearerAuth()
@Controller(['customer/resources', 'customers/resources'])
export class CustomersResourcesController {
  constructor(private readonly resourcesService: ResourcesService) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.customer)
  @ApiOperation({
    summary: 'List multimedia resources for the customer gym account',
  })
  @ApiOkResponse({ type: ResourceCategoryResponseDto, isArray: true })
  findAll(
    @CurrentUser() user: JwtPayload,
  ): Promise<ResourceCategoryResponseDto[]> {
    return this.resourcesService.findAll(user.id_account);
  }
}
