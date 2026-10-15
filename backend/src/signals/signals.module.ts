import { Module } from '@nestjs/common';
import { SignalsService } from './signals.service';
import { SignalsController } from './signals.controller';
import { AdminSignalsController } from './admin-signals.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [SignalsController, AdminSignalsController],
  providers: [SignalsService],
  exports: [SignalsService],
})
export class SignalsModule {}
