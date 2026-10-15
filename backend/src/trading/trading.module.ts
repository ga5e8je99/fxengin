import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from '../prisma/prisma.module';
import { TradingController } from './trading.controller';
import { AdminTradingController } from './admin-trading.controller';
import { TradingService } from './trading.service';

@Module({
  imports: [
    PrismaModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'fxengin_super_jwt_secret_key_2026_production_grade_998877!@#',
      signOptions: { expiresIn: '30d' },
    }),
  ],
  controllers: [TradingController, AdminTradingController],
  providers: [TradingService],
  exports: [TradingService],
})
export class TradingModule {}
