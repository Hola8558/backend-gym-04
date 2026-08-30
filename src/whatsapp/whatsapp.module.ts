import { Module } from '@nestjs/common';
import { RolesGuard } from '../common/guards/roles.guard';
import { EvolutionApiAdapter } from './adapters/evolution-api.adapter';
import { WHATSAPP_PROVIDER } from './constants/whatsapp-provider.token';
import { WhatsappController } from './whatsapp.controller';
import { WhatsappService } from './whatsapp.service';

@Module({
  controllers: [WhatsappController],
  providers: [
    WhatsappService,
    RolesGuard,
    {
      provide: WHATSAPP_PROVIDER,
      useClass: EvolutionApiAdapter,
    },
  ],
  exports: [WhatsappService, WHATSAPP_PROVIDER],
})
export class WhatsappModule {}
