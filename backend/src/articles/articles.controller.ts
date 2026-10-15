import { Controller, Get, Post, Put, Delete, Body, Query, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ArticlesService } from './articles.service';
import { CreateArticleDto, UpdateArticleDto } from './dto/article.dto';

@ApiTags('Articles & Educational Blog')
@Controller('articles')
export class ArticlesController {
  constructor(private readonly articlesService: ArticlesService) {}

  @Get()
  @ApiOperation({ summary: 'استعراض قائمة المقالات والمدونة' })
  @ApiResponse({ status: 200, description: 'قائمة المقالات' })
  async findAll(
    @Query('category') category?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('limit') limit?: number,
    @Query('page') page?: number,
  ) {
    return this.articlesService.findAll({ category, status, search, limit, page });
  }

  @Get(':slug')
  @ApiOperation({ summary: 'قراءة مقال محدد عبر الرابط التعريفي slug' })
  async findBySlug(@Param('slug') slug: string) {
    return this.articlesService.findBySlug(slug);
  }

  @Post()
  @ApiOperation({ summary: 'إنشاء مقال جديد' })
  async create(@Body() dto: CreateArticleDto) {
    return this.articlesService.create(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'تحديث بيانات مقال' })
  async update(@Param('id') id: string, @Body() dto: UpdateArticleDto) {
    return this.articlesService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'حذف مقال' })
  async remove(@Param('id') id: string) {
    return this.articlesService.remove(id);
  }
}
