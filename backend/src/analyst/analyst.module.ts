import { Module } from '@nestjs/common';
import { AnalystController } from './analyst.controller';
import { AnalystService } from './analyst.service';

@Module({
  controllers: [AnalystController],
  providers: [AnalystService],
  exports: [AnalystService],
})
export class AnalystModule {}
