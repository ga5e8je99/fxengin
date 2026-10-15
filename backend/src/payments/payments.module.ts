import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ActivationModule } from '../activation/activation.module';
import { MailModule } from '../mail/mail.module';
import { PaymentsService } from './payments.service';
import { AdminOrdersController } from './admin-orders.controller';
import { TelegramWebhookController } from './telegram-webhook.controller';

@Module({
  imports: [PrismaModule, ActivationModule, MailModule],
  controllers: [AdminOrdersController, TelegramWebhookController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
