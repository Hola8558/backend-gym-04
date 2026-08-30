import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { JwtPayload } from '../auth/jwt.strategy';
import { UpdateUserFeaturesDto } from './dto/update-user-features.dto';
import { UserFeatureResponseDto } from './dto/user-feature-response.dto';
import { FeaturesService } from './features.service';

@ApiTags('features')
@ApiBearerAuth()
@Controller('features')
export class FeaturesController {
  constructor(private readonly featuresService: FeaturesService) {}

  @Get('my-features')
  @ApiOperation({ summary: 'Feature flags for the authenticated user' })
  @ApiResponse({ status: 200, type: [UserFeatureResponseDto] })
  getMyFeatures(@CurrentUser() user: JwtPayload): Promise<UserFeatureResponseDto[]> {
    return this.featuresService.getUserFeatures(user.sub);
  }

  @Patch('my-features')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary:
      'Update feature flag statuses for the current user (solo_coach requires active 5008; gym owner requires active 5003).',
  })
  @ApiBody({ type: UpdateUserFeaturesDto })
  @ApiResponse({ status: 200, description: 'Flags updated' })
  @ApiResponse({ status: 403, description: 'Missing setup feature for account type' })
  patchMyFeatures(
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateUserFeaturesDto,
  ): Promise<{ message: string }> {
    return this.featuresService.updateUserFeatures(user.sub, dto);
  }
}
