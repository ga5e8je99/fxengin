import { Controller, Post, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../guards/admin.guard';
import { StorageService } from './storage.service';
import { GeneratePresignedUrlDto, ValidateExternalLinkDto } from './dto/storage.dto';

@ApiTags('Admin Cloud Storage')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('admin/storage')
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Post('presigned-url')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'توليد رابط رفع سحابي مباشر (MinIO / S3 Presigned URL) لرفع الفيديوهات دون استهلاك الـ VPS' })
  @ApiResponse({ status: 200, description: 'تم توليد تذكرة الرفع ورابط الوصول العام بنجاح' })
  async generatePresignedUrl(@Body() dto: GeneratePresignedUrlDto) {
    return this.storageService.generatePresignedUploadUrl(dto);
  }

  @Post('validate-link')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'فحص والتحقق من صحة رابط البث السحابي الخارجي أو ملف الـ PDF' })
  @ApiResponse({ status: 200, description: 'نتيجة التحقق من الرابط' })
  async validateExternalLink(@Body() dto: ValidateExternalLinkDto) {
    return this.storageService.validateExternalLink(dto.url);
  }
}
