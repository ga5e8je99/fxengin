import { Controller, Get, Query, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CmsService } from './cms.service';

@ApiTags('CMS & Platform Pages')
@Controller('pages')
export class CmsController {
  constructor(private readonly cmsService: CmsService) {}

  @Get()
  @ApiOperation({ summary: 'استعراض كافة الصفحات الثابتة المنشورة' })
  async findAll(@Query('category') category?: string, @Query('slug') slug?: string) {
    if (slug) {
      return this.cmsService.findBySlug(slug);
    }
    return this.cmsService.findAll({ category });
  }

  @Get(':slug')
  @ApiOperation({ summary: 'جلب محتوى صفحة ثابتة معينة' })
  async findBySlug(@Param('slug') slug: string) {
    return this.cmsService.findBySlug(slug);
  }
}
