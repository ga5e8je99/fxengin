import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber, IsOptional, IsBoolean, IsDateString, IsIn } from 'class-validator';

export class CreateCouponDto {
  @ApiProperty({ description: 'كود الخصم (مثل FX20)', example: 'FX20' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ description: 'نوع الخصم: PERCENTAGE أو FIXED', enum: ['PERCENTAGE', 'FIXED'], default: 'PERCENTAGE' })
  @IsIn(['PERCENTAGE', 'FIXED'])
  discountType: 'PERCENTAGE' | 'FIXED';

  @ApiProperty({ description: 'قيمة الخصم (نسبة مئوية أو مبلغ ثابت)', example: 20 })
  @IsNumber()
  discountValue: number;

  @ApiPropertyOptional({ description: 'الحد الأدنى لقيمة الشراء لتفعيل الخصم', example: 50 })
  @IsOptional()
  @IsNumber()
  minPurchase?: number;

  @ApiPropertyOptional({ description: 'الحد الأقصى لمبلغ الخصم (في حالة النسبة المئوية)', example: 100 })
  @IsOptional()
  @IsNumber()
  maxDiscount?: number;

  @ApiPropertyOptional({ description: 'معرف الكورس إذا كان الكود مخصصاً لكورس معين' })
  @IsOptional()
  @IsString()
  courseId?: string;

  @ApiPropertyOptional({ description: 'تاريخ انتهاء صلاحية الكود' })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @ApiPropertyOptional({ description: 'أقصى عدد مرات استخدام', default: 100 })
  @IsOptional()
  @IsNumber()
  maxUses?: number;

  @ApiPropertyOptional({ description: 'هل الكود نشط حالياً؟', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateCouponDto {
  @ApiPropertyOptional({ description: 'نوع الخصم: PERCENTAGE أو FIXED' })
  @IsOptional()
  @IsIn(['PERCENTAGE', 'FIXED'])
  discountType?: 'PERCENTAGE' | 'FIXED';

  @ApiPropertyOptional({ description: 'قيمة الخصم' })
  @IsOptional()
  @IsNumber()
  discountValue?: number;

  @ApiPropertyOptional({ description: 'الحد الأدنى لقيمة الشراء' })
  @IsOptional()
  @IsNumber()
  minPurchase?: number;

  @ApiPropertyOptional({ description: 'الحد الأقصى لمبلغ الخصم' })
  @IsOptional()
  @IsNumber()
  maxDiscount?: number;

  @ApiPropertyOptional({ description: 'معرف الكورس المخصص' })
  @IsOptional()
  @IsString()
  courseId?: string;

  @ApiPropertyOptional({ description: 'تاريخ انتهاء الصلاحية' })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @ApiPropertyOptional({ description: 'أقصى عدد مرات استخدام' })
  @IsOptional()
  @IsNumber()
  maxUses?: number;

  @ApiPropertyOptional({ description: 'حالة التفعيل' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
