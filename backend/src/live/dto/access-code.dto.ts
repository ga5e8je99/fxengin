import { IsString, IsNotEmpty, IsOptional, IsNumber, Min, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateManualAccessCodeDto {
  @ApiProperty({ description: 'الاسم الكامل للطالب', example: 'محمد عبد الله' })
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiProperty({ description: 'البريد الإلكتروني للطالب', example: 'mohammed@example.com' })
  @IsString()
  @IsNotEmpty()
  email: string;

  @ApiPropertyOptional({ description: 'رقم الهاتف أو الواتساب للطالب', example: '+966501234567' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ description: 'هل تم الدفع بنجاح؟', example: true, default: true })
  @IsBoolean()
  @IsOptional()
  isPaid?: boolean;

  @ApiPropertyOptional({ description: 'المبلغ المدفوع (إن وجد)', example: 99.0 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  paidAmount?: number;

  @ApiPropertyOptional({ description: 'العملة', example: 'USD', default: 'USD' })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiPropertyOptional({ description: 'ملاحظات إضافية من الإدارة' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ description: 'معرف المستخدم في حال كان مسجلاً بالمنصة' })
  @IsString()
  @IsOptional()
  userId?: string;
}

export class VerifyAccessCodeDto {
  @ApiProperty({ description: 'كود الدخول المخصص للبث المباشر', example: 'FXL-8942-K7P1' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiPropertyOptional({ description: 'البريد الإلكتروني للتحقق الإضافي (اختياري)' })
  @IsString()
  @IsOptional()
  email?: string;
}

export class LiveCourseCheckoutDto {
  @ApiProperty({ description: 'الاسم الكامل للمشتري', example: 'أحمد محمود' })
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiProperty({ description: 'البريد الإلكتروني للمشتري', example: 'ahmed@example.com' })
  @IsString()
  @IsNotEmpty()
  email: string;

  @ApiPropertyOptional({ description: 'رقم الهاتف' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ description: 'طريقة الدفع (usdt, card, etc.)', default: 'usdt' })
  @IsString()
  @IsOptional()
  paymentMethod?: string;

  @ApiPropertyOptional({ description: 'رقم معاملة البلوكتشين أو معرف الدفع TXID' })
  @IsString()
  @IsOptional()
  txid?: string;

  @ApiPropertyOptional({ description: 'المبلغ المدفوع' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  paidAmount?: number;
}
