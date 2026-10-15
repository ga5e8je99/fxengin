import { Module } from '@nestjs/common';
import { LiveController } from './live.controller';
import { AdminLiveController } from './admin-live.controller';
import { LiveWebhookController } from './live-webhook.controller';
import { LiveService } from './live.service';
import { LiveGateway } from './live.gateway';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [LiveController, AdminLiveController, LiveWebhookController],
  providers: [LiveService, LiveGateway],
  exports: [LiveService, LiveGateway],
})
export class LiveModule {}

