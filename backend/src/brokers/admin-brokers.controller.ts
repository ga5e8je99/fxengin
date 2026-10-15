import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { BrokersService } from './brokers.service';
import { CreateBrokerDto, UpdateBrokerDto } from './dto/broker.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../admin/guards/admin.guard';

@ApiTags('Admin Brokers Management')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('admin/brokers')
export class AdminBrokersController {
  constructor(private readonly brokersService: BrokersService) {}

  @Get()
  @ApiOperation({ summary: 'إدارة واستعراض جميع الوسطاء من لوحة التحكم' })
  async findAll(@Query('category') category?: string) {
    return this.brokersService.findAll({ category });
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'إضافة وسيط أو شركة تمويل جديدة' })
  @ApiResponse({ status: 201, description: 'تم إنشاء الوسيط بنجاح' })
  async create(@Body() dto: CreateBrokerDto) {
    return this.brokersService.create(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'تحديث بيانات وسيط' })
  async update(@Param('id') id: string, @Body() dto: UpdateBrokerDto) {
    return this.brokersService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'حذف وسيط من النظام' })
  async remove(@Param('id') id: string) {
    return this.brokersService.remove(id);
  }
}
