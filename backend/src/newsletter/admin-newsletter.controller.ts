import { Controller, Get, Delete, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { NewsletterService } from './newsletter.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../admin/guards/admin.guard';

@ApiTags('Admin Newsletter Subscribers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('admin/newsletter')
export class AdminNewsletterController {
  constructor(private readonly newsletterService: NewsletterService) {}

  @Get()
  @ApiOperation({ summary: 'استعراض قائمة المشتركين في النشرة البريدية' })
  async findAll(@Query('search') search?: string, @Query('page') page?: number, @Query('limit') limit?: number) {
    return this.newsletterService.findAll({ search, page, limit });
  }

  @Delete(':id')
  @ApiOperation({ summary: 'إلغاء اشتراك أو حذف بريد من القائمة' })
  async remove(@Param('id') id: string) {
    return this.newsletterService.remove(id);
  }
}
