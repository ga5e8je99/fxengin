import { IsString, IsNotEmpty, IsOptional, IsNumber, IsEnum, IsBoolean, IsUrl, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum CourseAccessTierDto {
  FREE = 'FREE',
  STARTER = 'STARTER',
  PRO = 'PRO',
  VIP = 'VIP',
  ONE_TIME = 'ONE_TIME',
}

export enum CourseLevelDto {
  BEGINNER = 'BEGINNER',
  INTERMEDIATE = 'INTERMEDIATE',
  ADVANCED = 'ADVANCED',
  VIP_ELITE = 'VIP_ELITE',
}

export class CreateCourseDto {
  @ApiProperty({ description: 'عنوان الكورس الرئيسي', example: 'هندسة روبوتات التداول الخوارزمية MQL5' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ description: 'الاسم الرابطي المميز slug', example: 'algorithmic-mt5-bot-engineering' })
  @IsString()
  @IsOptional()
  slug?: string;

  @ApiPropertyOptional({ description: 'عنوان فرعي مختصر للكورس', example: 'برمجة الإكسبيرتات واختبار استراتيجيات التداول الآلي' })
  @IsString()
  @IsOptional()
  subtitle?: string;

  @ApiProperty({ description: 'الوصف الكامل والشامل للكورس ومحاوره' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiPropertyOptional({ description: 'رابط صورة غلاف الكورس (S3 / CDN URL)' })
  @IsString()
  @IsOptional()
  thumbnailUrl?: string;

  @ApiPropertyOptional({ description: 'رابط الفيديو الترويجي الإعلاني (Teaser Stream / S3 URL)' })
  @IsString()
  @IsOptional()
  promoVideoUrl?: string;

  @ApiProperty({ description: 'سعر الكورس بالدولار (0 للمجاني)', example: 199.0 })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiPropertyOptional({ description: 'السعر المخفض قبل الخصم (إن وجد)', example: 299.0 })
  @IsNumber()
  @IsOptional()
  discountPrice?: number;

  @ApiPropertyOptional({ description: 'مستوى الاشتراك المطلوب للوصول', enum: CourseAccessTierDto, default: CourseAccessTierDto.FREE })
  @IsEnum(CourseAccessTierDto)
  @IsOptional()
  accessTier?: CourseAccessTierDto;

  @ApiPropertyOptional({ description: 'التقييم المبدئي المحدد من المشرف قبل الإطلاق (1 إلى 5)', example: 4.9 })
  @IsNumber()
  @Min(1)
  @Max(5)
  @IsOptional()
  adminRating?: number;

  @ApiPropertyOptional({ description: 'عدد التقييمات المعروض المحدد من المشرف', example: 142 })
  @IsNumber()
  @IsOptional()
  adminReviewCount?: number;

  @ApiPropertyOptional({ description: 'تاريخ نشر أو إطلاق الكورس المحدد من المشرف', example: '2026-09-01T00:00:00Z' })
  @IsString()
  @IsOptional()
  releaseDate?: string;

  @ApiPropertyOptional({ description: 'مستوى الصعوبة التدريبي', enum: CourseLevelDto, default: CourseLevelDto.BEGINNER })
  @IsEnum(CourseLevelDto)
  @IsOptional()
  difficulty?: CourseLevelDto;

  @ApiPropertyOptional({ description: 'تصنيف الكورس', example: 'Algorithmic Bot Dev' })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiPropertyOptional({ description: 'حالة نشر الكورس لجمهور المنصة', default: false })
  @IsBoolean()
  @IsOptional()
  isPublished?: boolean;
}
