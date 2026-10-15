import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SignalsService } from './signals.service';
import { CreateSignalDto, UpdateSignalDto } from './dto/signal.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../admin/guards/admin.guard';

@ApiTags('Admin Trading Signals')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('admin/signals')
export class AdminSignalsController {
  constructor(private readonly signalsService: SignalsService) {}

  @Get()
  @ApiOperation({ summary: 'إدارة واستعراض جميع الإشارات الفنية' })
  async findAll(
    @Query('symbol') symbol?: string,
    @Query('status') status?: string,
    @Query('limit') limit?: number,
  ) {
    return this.signalsService.findAll({ symbol, status, limit });
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'بث إشارة تداول جديدة من لوحة التحكم' })
  @ApiResponse({ status: 201, description: 'تم إنشاء وبث الإشارة بنجاح' })
  async create(@Body() dto: CreateSignalDto) {
    return this.signalsService.create(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'تحديث حالة أو أهداف إشارة قائمة' })
  async update(@Param('id') id: string, @Body() dto: UpdateSignalDto) {
    return this.signalsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'حذف إشارة من النظام' })
  async remove(@Param('id') id: string) {
    return this.signalsService.remove(id);
  }
}
