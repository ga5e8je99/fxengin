import { Controller, Post, Body, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';

@ApiTags('Telegram Webhook')
@Controller('telegram')
export class TelegramWebhookController {
  private readonly logger = new Logger(TelegramWebhookController.name);

  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'استقبال أحداث ونقرات أزرار بوت التيليجرام للإدارة' })
  async handleWebhook(@Body() update: any) {
    if (update?.callback_query) {
      this.logger.log(`Received Telegram callback query: ${update.callback_query.data}`);
      return this.paymentsService.handleTelegramCallbackQuery(update.callback_query);
    }
    return { ok: true };
  }
}
