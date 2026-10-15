import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { TestimonialsService } from './testimonials.service';

@ApiTags('Client Testimonials & Reviews')
@Controller('testimonials')
export class TestimonialsController {
  constructor(private readonly testimonialsService: TestimonialsService) {}

  @Get()
  @ApiOperation({ summary: 'استعراض آراء وتقييمات العملاء المعتمدة للموقع' })
  @ApiResponse({ status: 200, description: 'قائمة التقييمات' })
  async findPublic(@Query('category') category?: string) {
    return this.testimonialsService.findPublic(category);
  }
}
