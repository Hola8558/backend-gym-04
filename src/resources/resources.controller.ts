import {
  Body,
  Controller,
  Get,
  ParseArrayPipe,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/current-user.decorator';
import type { JwtPayload } from '../auth/jwt.strategy';
import { RequireFeature } from '../common/decorators/require-feature.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { FeatureGuard } from '../common/guards/feature.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { ResourceCategoryResponseDto } from './dto/resource-category-response.dto';
import { SaveResourceCategoryDto } from './dto/save-resource-category.dto';
import { ResourcesService } from './resources.service';

@ApiTags('resources')
@ApiBearerAuth()
@UseGuards(RolesGuard, FeatureGuard)
@Roles(UserRole.solo_coach)
@RequireFeature(5013)
@Controller('resources')
export class ResourcesController {
  constructor(private readonly resourcesService: ResourcesService) {}

  @Get()
  @ApiOperation({ summary: 'List multimedia resources for the current account' })
  @ApiOkResponse({ type: ResourceCategoryResponseDto, isArray: true })
  findAll(
    @CurrentUser() user: JwtPayload,
  ): Promise<ResourceCategoryResponseDto[]> {
    return this.resourcesService.findAll(user.id_account);
  }

  @Patch()
  @ApiOperation({
    summary: 'Save the complete multimedia resources tree for the current account',
  })
  @ApiBody({ type: SaveResourceCategoryDto, isArray: true })
  @ApiOkResponse({ type: ResourceCategoryResponseDto, isArray: true })
  saveAll(
    @CurrentUser() user: JwtPayload,
    @Body(new ParseArrayPipe({ items: SaveResourceCategoryDto }))
    categories: SaveResourceCategoryDto[],
  ): Promise<ResourceCategoryResponseDto[]> {
    return this.resourcesService.saveAll(user.id_account, categories);
  }
}
