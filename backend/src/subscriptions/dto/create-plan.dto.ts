import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsArray,
  IsEnum,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum BillingPeriodDto {
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  SEMI_ANNUAL = 'SEMI_ANNUAL',
  ANNUAL = 'ANNUAL',
  LIFETIME = 'LIFETIME',
}

export class CreatePlanDto {
  @ApiProperty({
    example: 'باقة إشارات البوت المتقدمة',
    description: 'اسم باقة الاشتراك باللغة العربية',
  })
  @IsString()
  @IsNotEmpty({ message: 'اسم الباقة مطلوب' })
  name: string;

  @ApiProperty({
    example: 'bot-signals-pro',
    description: 'الاسم الرابطي الفريد للباقة (slug)',
  })
  @IsString()
  @IsNotEmpty({ message: 'معرف الرابط slug مطلوب' })
  slug: string;

  @ApiProperty({
    example: 'وصول فوري لإشارات بوت التداول الآلي MT5 مع توصيات الدخول والهدف',
    description: 'الوصف التعريفي للباقة وما تقدمه للمشتركين',
  })
  @IsString()
  @IsNotEmpty({ message: 'وصف الباقة مطلوب' })
  description: string;

  @ApiProperty({
    example: 49.0,
    description: 'سعر الباقة بالدولار الأمريكي (USD)',
  })
  @IsNumber({}, { message: 'يجب أن يكون السعر رقماً صحيحاً أو عشرياً' })
  @Min(0, { message: 'لا يمكن أن يكون السعر سالباً' })
  price: number;

  @ApiPropertyOptional({
    example: 'USD',
    default: 'USD',
    description: 'عملة الباقة (افتراضياً USD)',
  })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiProperty({
    enum: BillingPeriodDto,
    example: BillingPeriodDto.MONTHLY,
    description: 'دورة تجديد الاشتراك (شهري / سنوي / مدى الحياة)',
  })
  @IsEnum(BillingPeriodDto, { message: 'دورة التجديد غير صالحة' })
  billingPeriod: BillingPeriodDto;

  @ApiPropertyOptional({
    example: 'الأكثر طلباً ⭐',
    description: 'وسم تسويقي مميز يظهر أعلى كارت الباقة',
  })
  @IsString()
  @IsOptional()
  badge?: string;

  @ApiPropertyOptional({
    example: '#FC8702',
    default: '#FC8702',
    description: 'لون الكارت التمييزي بتنسيق Hex',
  })
  @IsString()
  @IsOptional()
  highlightColor?: string;

  @ApiPropertyOptional({
    example: true,
    default: true,
    description: 'هل الباقة مفعلة وجاهزة للعرض للجمهور',
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({
    example: 1,
    default: 0,
    description: 'ترتيب عرض الباقة في صفحة الأسعار',
  })
  @IsNumber()
  @IsOptional()
  sortOrder?: number;

  @ApiProperty({
    example: [
      'وصول كامل لإشارات بوت الذهب والعملات',
      'تحديثات فورية 24/5',
      'دعم فني وتوجيه مباشر',
    ],
    description: 'مصفوفة النقاط والمميزات التسويقية المعروضة في الكارت',
    type: [String],
  })
  @IsArray({ message: 'يجب أن تكون المميزات مصفوفة نصوص' })
  @IsString({ each: true })
  features: string[];

  @ApiProperty({
    example: ['BOT_SIGNALS_ACCESS', 'LIVE_CHAT_PRIVILEGE'],
    description: 'مصفوفة الصلاحيات التقنية الممنوحة للمشترك في هذه الباقة',
    type: [String],
  })
  @IsArray({ message: 'يجب أن تكون الصلاحيات مصفوفة نصوص' })
  @IsString({ each: true })
  permissions: string[];
}
