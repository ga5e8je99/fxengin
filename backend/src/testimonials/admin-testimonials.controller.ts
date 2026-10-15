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
import { TestimonialsService } from './testimonials.service';
import { CreateTestimonialDto, UpdateTestimonialDto } from './dto/testimonial.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../admin/guards/admin.guard';

@ApiTags('Admin Testimonials Management')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('admin/testimonials')
export class AdminTestimonialsController {
  constructor(private readonly testimonialsService: TestimonialsService) {}

  @Get()
  @ApiOperation({ summary: 'إدارة واستعراض كافة المراجعات (معتمدة وغير معتمدة)' })
  async findAll(
    @Query('search') search?: string,
    @Query('category') category?: string,
    @Query('isApproved') isApproved?: boolean,
  ) {
    return this.testimonialsService.findAllAdmin({ search, category, isApproved });
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'إضافة رأي أو مراجعة عميل جديدة' })
  @ApiResponse({ status: 201, description: 'تم إنشاء التقييم بنجاح' })
  async create(@Body() dto: CreateTestimonialDto) {
    return this.testimonialsService.create(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'تحديث بيانات أو حالة اعتماد المراجعة' })
  async update(@Param('id') id: string, @Body() dto: UpdateTestimonialDto) {
    return this.testimonialsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'حذف مراجعة من النظام' })
  async remove(@Param('id') id: string) {
    return this.testimonialsService.remove(id);
  }
}
