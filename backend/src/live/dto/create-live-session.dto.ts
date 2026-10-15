import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsEnum, IsInt, IsDateString, Min, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CourseAccessTier } from '@prisma/client';

export class CreateLiveSessionDto {
  @ApiProperty({ description: 'عنوان جلسة البث المباشر', example: 'بث تحليلي مباشر لافتتاح السوق الأمريكي وحركة الذهب XAUUSD' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ description: 'الاسم الرابطي (Slug)', example: 'us-market-open-gold-analysis' })
  @IsString()
  @IsOptional()
  slug?: string;

  @ApiProperty({ description: 'شرح وتفاصيل محاور جلسة البث والصفقات المستهدفة' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiPropertyOptional({ description: 'صورة غلاف البث' })
  @IsString()
  @IsOptional()
  coverImage?: string;

  @ApiPropertyOptional({ description: 'رابط البث (HLS .m3u8, YouTube Embed, Cloudflare Stream)' })
  @IsString()
  @IsOptional()
  streamUrl?: string;

  @ApiPropertyOptional({ description: 'نوع مصدر البث: HLS, YOUTUBE, OBS, CUSTOM', default: 'HLS' })
  @IsString()
  @IsOptional()
  streamType?: string;

  @ApiPropertyOptional({ description: 'مفتاح البث المخصص (OBS Stream Key)' })
  @IsString()
  @IsOptional()
  streamKey?: string;

  @ApiProperty({ description: 'الموعد المجدول لبدء البث (ISO String)', example: '2026-09-08T14:30:00.000Z' })
  @IsDateString()
  scheduledStartTime: string;

  @ApiPropertyOptional({ description: 'الموعد التقديري لانتهاء البث (ISO String)' })
  @IsDateString()
  @IsOptional()
  scheduledEndTime?: string;

  @ApiPropertyOptional({ description: 'الحد الأدنى للباقة المسموح لها بحضور البث', enum: CourseAccessTier, default: CourseAccessTier.FREE })
  @IsEnum(CourseAccessTier)
  @IsOptional()
  minTier?: CourseAccessTier;

  @ApiPropertyOptional({ description: 'هل البث متاح مجاناً لكافة الأعضاء', default: true })
  @IsBoolean()
  @IsOptional()
  isFree?: boolean;

  @ApiPropertyOptional({ description: 'هل الجلسة دورة تدريبية مدفوعة' })
  @IsBoolean()
  @IsOptional()
  isPaidCourse?: boolean;

  @ApiPropertyOptional({ description: 'سعر الكورس المباشر', default: 0.0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  price?: number;

  @ApiPropertyOptional({ description: 'العملة', default: 'USD' })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiPropertyOptional({ description: 'اسم المحلل أو المدرب المحاضر', default: 'FxEngin Market Analyst' })
  @IsString()
  @IsOptional()
  instructorName?: string;

  @ApiPropertyOptional({ description: 'الحد الأقصى لعدد الحاضرين في القاعة', default: 500 })
  @IsInt()
  @Min(10)
  @IsOptional()
  maxParticipants?: number;
}
