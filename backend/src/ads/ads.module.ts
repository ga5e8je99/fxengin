import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AdsService } from './ads.service';
import { AdminAdsController } from './admin-ads.controller';
import { AdsController } from './ads.controller';

@Module({
  imports: [PrismaModule],
  controllers: [AdminAdsController, AdsController],
  providers: [AdsService],
  exports: [AdsService],
})
export class AdsModule {}
