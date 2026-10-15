import { Module } from '@nestjs/common';
import { BrokersService } from './brokers.service';
import { BrokersController } from './brokers.controller';
import { AdminBrokersController } from './admin-brokers.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [BrokersController, AdminBrokersController],
  providers: [BrokersService],
  exports: [BrokersService],
})
export class BrokersModule {}
