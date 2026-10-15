import { Controller, Get, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CmsService } from './cms.service';
import { UpdateCmsPageDto } from './dto/cms-page.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../admin/guards/admin.guard';

@ApiTags('Admin CMS Pages Management')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('admin/pages')
export class AdminCmsController {
  constructor(private readonly cmsService: CmsService) {}

  @Get()
  @ApiOperation({ summary: 'استعراض جميع الصفحات الثابتة والقانونية' })
  async findAll(@Query('category') category?: string) {
    return this.cmsService.findAll({ category });
  }

  @Put(':slug')
  @ApiOperation({ summary: 'تعديل محتوى صفحة ثابتة وحفظها في قاعدة البيانات' })
  async updatePage(@Param('slug') slug: string, @Body() dto: UpdateCmsPageDto) {
    return this.cmsService.updatePage(slug, dto);
  }
}
