import { Module } from '@nestjs/common';
import { EMAIL_PROVIDER } from './constants/email-provider.token';
import { ResendEmailService } from './resend-email.service';

@Module({
  providers: [
    {
      provide: EMAIL_PROVIDER,
      useClass: ResendEmailService,
    },
  ],
  exports: [EMAIL_PROVIDER],
})
export class EmailModule {}
