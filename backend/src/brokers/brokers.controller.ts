import { Controller, Get, Query, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { BrokersService } from './brokers.service';

@ApiTags('Forex & Prop Brokers')
@Controller('brokers')
export class BrokersController {
  constructor(private readonly brokersService: BrokersService) {}

  @Get()
  @ApiOperation({ summary: 'استعراض قائمة الوسطاء المعتمدين وشركات التمويل' })
  @ApiResponse({ status: 200, description: 'قائمة الوسطاء' })
  async findAll(@Query('category') category?: string, @Query('activeOnly') activeOnly?: string) {
    return this.brokersService.findAll({ category, activeOnly: activeOnly === 'true' });
  }

  @Get(':slug')
  @ApiOperation({ summary: 'تفاصيل وسيط معين' })
  async findBySlug(@Param('slug') slug: string) {
    return this.brokersService.findBySlug(slug);
  }
}
