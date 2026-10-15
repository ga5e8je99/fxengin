import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsBoolean,
  IsInt,
  IsDateString,
} from 'class-validator';
import { AdPlacement } from '@prisma/client';

export class CreateAdDto {
  @ApiProperty({ description: 'عنوان الإعلان باللغة العربية', example: 'إشارات حية 24/5' })
  @IsString()
  @IsNotEmpty({ message: 'العنوان العربي مطلوب' })
  titleAr: string;

  @ApiPropertyOptional({ description: 'عنوان الإعلان باللغة الإنجليزية', example: 'Live VIP Signals' })
  @IsString()
  @IsOptional()
  titleEn?: string;

  @ApiPropertyOptional({ description: 'وصف الإعلان باللغة العربية', example: 'توصيات يومية مدروسة للذهب والعملات' })
  @IsString()
  @IsOptional()
  descAr?: string;

  @ApiPropertyOptional({ description: 'وصف الإعلان باللغة الإنجليزية', example: 'Daily setups for Gold & Forex' })
  @IsString()
  @IsOptional()
  descEn?: string;

  @ApiPropertyOptional({ description: 'وسم الإعلان (Badge)', example: 'VIP SIGNALS' })
  @IsString()
  @IsOptional()
  badge?: string;

  @ApiPropertyOptional({ description: 'لون الوسم', example: '#FB8704' })
  @IsString()
  @IsOptional()
  badgeColor?: string;

  @ApiPropertyOptional({ description: 'نص التميز (Tag)', example: '92% WIN RATE' })
  @IsString()
  @IsOptional()
  tag?: string;

  @ApiPropertyOptional({ description: 'رابط صورة البنر', example: '/assets/Images/banners/gold.png' })
  @IsString()
  @IsOptional()
  imageUrl?: string;

  @ApiProperty({ description: 'رابط الوجهة عند النقر', example: '/courses' })
  @IsString()
  @IsNotEmpty({ message: 'رابط الوجهة مطلوب' })
  targetUrl: string;

  @ApiPropertyOptional({ description: 'نص زر الإجراء بالعربية', example: 'انضم الآن' })
  @IsString()
  @IsOptional()
  btnTextAr?: string;

  @ApiPropertyOptional({ description: 'نص زر الإجراء بالإنجليزية', example: 'Join Now' })
  @IsString()
  @IsOptional()
  btnTextEn?: string;

  @ApiProperty({ enum: AdPlacement, description: 'المساحة الإعلانية', example: AdPlacement.SKYSCRAPER_RIGHT })
  @IsEnum(AdPlacement, { message: 'المساحة الإعلانية غير صحيحة' })
  placement: AdPlacement;

  @ApiPropertyOptional({ description: 'حالة التفعيل', example: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'ترتيب الظهور', example: 0 })
  @IsInt()
  @IsOptional()
  sortOrder?: number;

  @ApiPropertyOptional({ description: 'تاريخ بداية الحملة', example: '2026-09-20T00:00:00.000Z' })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({ description: 'تاريخ نهاية الحملة', example: '2026-12-31T23:59:59.000Z' })
  @IsDateString()
  @IsOptional()
  endDate?: string;
}
