import { IsString, IsNotEmpty, IsOptional, IsInt, IsBoolean, Min, Max, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateLessonDto {
  @ApiProperty({ description: 'عنوان الحصة أو الدرس', example: 'الحصة 1: تحديد مناطق كتل الأوامر Institutional Order Blocks' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ description: 'وصف تفصيلي لمحتوى الحصة والنقاط المشروحة' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'ترتيب الحصة داخل القسم', example: 1, default: 0 })
  @IsInt()
  @Min(0)
  @IsOptional()
  orderIndex?: number;

  @ApiPropertyOptional({ description: 'مدة الفيديو بالثواني', example: 1800, default: 0 })
  @IsInt()
  @Min(0)
  @IsOptional()
  durationSeconds?: number;

  @ApiPropertyOptional({ description: 'رابط تشغيل الفيديو الأساسي (S3/MinIO/CDN/HLS URL)' })
  @IsString()
  @IsOptional()
  videoUrl?: string;

  @ApiPropertyOptional({
    description: 'روابط الجودات المتعددة لتشغيل الفيديو (1080p, 720p, 480p)',
    example: {
      '1080p': 'https://s3.fxengen.com/courses/c1/l1-1080p.mp4',
      '720p': 'https://s3.fxengen.com/courses/c1/l1-720p.mp4',
      '480p': 'https://s3.fxengen.com/courses/c1/l1-480p.mp4'
    }
  })
  @IsObject()
  @IsOptional()
  videoQualities?: Record<string, string>;

  @ApiPropertyOptional({ description: 'هل الحصة متاحة للمعاينة المجانية قبل الشراء؟', default: false })
  @IsBoolean()
  @IsOptional()
  isFreePreview?: boolean;

  @ApiPropertyOptional({ description: 'النسبة المئوية الإلزامية للمشاهدة لتأكيد الإتمام (افتراضي 80%)', example: 80, default: 80 })
  @IsInt()
  @Min(10)
  @Max(100)
  @IsOptional()
  requiredWatchPercent?: number;
}

export class UpdateLessonDto {
  @ApiPropertyOptional({ description: 'عنوان الحصة أو الدرس' })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({ description: 'وصف تفصيلي للحصة' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'ترتيب الحصة داخل القسم' })
  @IsInt()
  @Min(0)
  @IsOptional()
  orderIndex?: number;

  @ApiPropertyOptional({ description: 'مدة الفيديو بالثواني' })
  @IsInt()
  @Min(0)
  @IsOptional()
  durationSeconds?: number;

  @ApiPropertyOptional({ description: 'رابط تشغيل الفيديو الأساسي' })
  @IsString()
  @IsOptional()
  videoUrl?: string;

  @ApiPropertyOptional({ description: 'روابط الجودات المتعددة لتشغيل الفيديو' })
  @IsObject()
  @IsOptional()
  videoQualities?: Record<string, string>;

  @ApiPropertyOptional({ description: 'هل الحصة متاحة للمعاينة المجانية؟' })
  @IsBoolean()
  @IsOptional()
  isFreePreview?: boolean;

  @ApiPropertyOptional({ description: 'النسبة المئوية الإلزامية للمشاهدة' })
  @IsInt()
  @Min(10)
  @Max(100)
  @IsOptional()
  requiredWatchPercent?: number;
}

export class CreateResourceDto {
  @ApiProperty({ description: 'عنوان المرفق التدريبي', example: 'دليل ملخص كتل الأوامر والمناطق السعرية PDF' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ description: 'نوع الملف (PDF, ZIP, MQL5)', default: 'PDF' })
  @IsString()
  @IsOptional()
  fileType?: string;

  @ApiProperty({ description: 'رابط تنزيل الملف السحابي (S3/MinIO link)' })
  @IsString()
  @IsNotEmpty()
  fileUrl: string;

  @ApiPropertyOptional({ description: 'حجم الملف للعرض', example: '3.8 MB' })
  @IsString()
  @IsOptional()
  fileSize?: string;
}

export class CreateCaptionDto {
  @ApiProperty({ description: 'رمز لغة الترجمة (ar, en)', example: 'ar' })
  @IsString()
  @IsNotEmpty()
  language: string;

  @ApiProperty({ description: 'التسمية الظاهرة في مشغل الفيديو', example: 'العربية' })
  @IsString()
  @IsNotEmpty()
  label: string;

  @ApiProperty({ description: 'رابط ملف الترجمة السحابي (.vtt file URL)' })
  @IsString()
  @IsNotEmpty()
  url: string;

  @ApiPropertyOptional({ description: 'هل هي لغة الترجمة الافتراضية؟', default: false })
  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;
}
