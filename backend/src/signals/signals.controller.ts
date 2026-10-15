import { Controller, Get, Query, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SignalsService } from './signals.service';

@ApiTags('Trading Signals (Public)')
@Controller('signals')
export class SignalsController {
  constructor(private readonly signalsService: SignalsService) {}

  @Get()
  @ApiOperation({ summary: 'قائمة الإشارات الفنية العامة' })
  @ApiResponse({ status: 200, description: 'قائمة الإشارات' })
  async findAll(@Query('symbol') symbol?: string, @Query('status') status?: string, @Query('limit') limit?: number) {
    return this.signalsService.findAll({ symbol, status, limit });
  }

  @Get('active')
  @ApiOperation({ summary: 'الإشارات الفنية النشطة حالياً' })
  @ApiResponse({ status: 200, description: 'الإشارات النشطة' })
  async findActive() {
    return this.signalsService.findActive();
  }

  @Get(':id')
  @ApiOperation({ summary: 'تفاصيل إشارة معينة' })
  async findOne(@Param('id') id: string) {
    return this.signalsService.findOne(id);
  }
}
