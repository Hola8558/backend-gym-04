import {

  Body,

  Controller,

  HttpCode,

  HttpStatus,

  Param,

  ParseIntPipe,

  Post,

  UseGuards,

} from '@nestjs/common';

import {

  ApiBearerAuth,

  ApiOkResponse,

  ApiOperation,

  ApiTags,

} from '@nestjs/swagger';

import { JwtAuthGuard } from '../../auth/jwt-auth.guard';

import { CurrentUser } from '../../auth/current-user.decorator';

import type { JwtPayload } from '../../auth/jwt.strategy';

import { CustomersMenusService } from './customers-menus.service';

import { HistoryCustomerMenuItemDto } from './dto/history-customer-menu-item.dto';

import { SyncActiveCustomerMenuDto } from './dto/sync-active-customer-menu.dto';

import { SyncActiveCustomerMenuResponseDto } from './dto/sync-active-customer-menu-response.dto';



/**

 * Flutter / mobile menus viewer (sync + history).

 * Auth protocol matches routines viewer: JWT only, no RolesGuard.

 */

@ApiTags('customers / menus')

@ApiBearerAuth()

@Controller('customer-menus')

export class CustomersMenusController {

  constructor(private readonly customersMenusService: CustomersMenusService) {}



  @Post()

  @HttpCode(HttpStatus.OK)

  @UseGuards(JwtAuthGuard)

  @ApiOperation({

    summary:

      'Flutter sync: newest menu for JWT sub. If created_at+updated_at match → isUpToDate; else full hydrated menu',

  })

  @ApiOkResponse({ type: SyncActiveCustomerMenuResponseDto })

  syncActiveMenuForToken(

    @CurrentUser() user: JwtPayload,

    @Body() dto: SyncActiveCustomerMenuDto,

  ): Promise<SyncActiveCustomerMenuResponseDto> {

    return this.customersMenusService.syncActiveMenuHydrated(

      user.id_account,

      user.sub,

      user.sub,

      dto,

    );

  }



  @Post('history')

  @HttpCode(HttpStatus.OK)

  @UseGuards(JwtAuthGuard)

  @ApiOperation({

    summary:

      'Flutter history: all non-deleted menus for JWT sub, newest first, each hydrated',

  })

  @ApiOkResponse({ type: HistoryCustomerMenuItemDto, isArray: true })

  getMenuHistoryForToken(

    @CurrentUser() user: JwtPayload,

  ): Promise<HistoryCustomerMenuItemDto[]> {

    return this.customersMenusService.getMenuHistoryHydrated(

      user.id_account,

      user.sub,

      user.sub,

    );

  }



  @Post('history/:id_user')

  @HttpCode(HttpStatus.OK)

  @UseGuards(JwtAuthGuard)

  @ApiOperation({

    summary:

      'Flutter history: all non-deleted menus for id_user (same account), hydrated',

  })

  @ApiOkResponse({ type: HistoryCustomerMenuItemDto, isArray: true })

  getMenuHistory(

    @CurrentUser() user: JwtPayload,

    @Param('id_user', ParseIntPipe) idUser: number,

  ): Promise<HistoryCustomerMenuItemDto[]> {

    return this.customersMenusService.getMenuHistoryHydrated(

      user.id_account,

      user.sub,

      idUser,

    );

  }



  @Post('active/:id_user')

  @HttpCode(HttpStatus.OK)

  @UseGuards(JwtAuthGuard)

  @ApiOperation({

    summary:

      'Flutter sync: newest menu for id_user (same account). Cache stamp in body',

  })

  @ApiOkResponse({ type: SyncActiveCustomerMenuResponseDto })

  syncActiveMenu(

    @CurrentUser() user: JwtPayload,

    @Param('id_user', ParseIntPipe) idUser: number,

    @Body() dto: SyncActiveCustomerMenuDto,

  ): Promise<SyncActiveCustomerMenuResponseDto> {

    return this.customersMenusService.syncActiveMenuHydrated(

      user.id_account,

      user.sub,

      idUser,

      dto,

    );

  }



  @Post('client/:id_user')

  @HttpCode(HttpStatus.OK)

  @UseGuards(JwtAuthGuard)

  @ApiOperation({

    summary:

      'Alias of active/:id_user — same auth pattern as routines client sync',

  })

  @ApiOkResponse({ type: SyncActiveCustomerMenuResponseDto })

  syncActiveMenuByClient(

    @CurrentUser() user: JwtPayload,

    @Param('id_user', ParseIntPipe) idUser: number,

    @Body() dto: SyncActiveCustomerMenuDto,

  ): Promise<SyncActiveCustomerMenuResponseDto> {

    return this.customersMenusService.syncActiveMenuHydrated(

      user.id_account,

      user.sub,

      idUser,

      dto,

    );

  }

}

