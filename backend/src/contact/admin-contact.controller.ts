import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ContactService } from './contact.service';
import { UpdateContactStatusDto } from './dto/contact.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../admin/guards/admin.guard';

@ApiTags('Admin Contact Messages Inbox')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('admin/contact')
export class AdminContactController {
  constructor(private readonly contactService: ContactService) {}

  @Get()
  @ApiOperation({ summary: 'استعراض رسائل التواصل مع الفلترة والبحث' })
  async findAll(
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.contactService.findAll({ status, search, page, limit });
  }

  @Get(':id')
  @ApiOperation({ summary: 'قراءة رسالة تواصل محددة' })
  async findOne(@Param('id') id: string) {
    return this.contactService.findOne(id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'تحديث حالة الرسالة (مقروءة، محلولة، وملاحظات الرد)' })
  async updateStatus(@Param('id') id: string, @Body() dto: UpdateContactStatusDto) {
    return this.contactService.updateStatus(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'حذف رسالة تواصل' })
  async remove(@Param('id') id: string) {
    return this.contactService.remove(id);
  }
}
