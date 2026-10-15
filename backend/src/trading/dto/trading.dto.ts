import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsEnum,
  Min,
  Max,
  IsIn,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProductType } from '@prisma/client';

export class ActivateTradingAccountDto {
  @ApiProperty({ description: 'كود التفعيل الصادر بعد الدفع', example: 'FXG-ABCD-1234-EFGH' })
  @IsString()
  @IsNotEmpty({ message: 'كود التفعيل مطلوب' })
  activationCode: string;

  @ApiPropertyOptional({ description: 'اسم المتداول على الشاشة', example: 'Ahmed FX' })
  @IsString()
  @IsOptional()
  accountName?: string;
}

export class DirectGuestTradingDto {
  @ApiPropertyOptional({ description: 'اسم المتداول التجريبي', example: 'Demo Guest' })
  @IsString()
  @IsOptional()
  accountName?: string;

  @ApiPropertyOptional({ description: 'معرف باقة المسابقة المرغوبة', example: 'cmu...' })
  @IsString()
  @IsOptional()
  planId?: string;
}

export class OpenPositionDto {
  @ApiProperty({ description: 'رمز الزوج أو السلعة', example: 'EURUSD' })
  @IsString()
  @IsNotEmpty({ message: 'رمز الأداة المالية مطلوب' })
  symbol: string;

  @ApiProperty({ description: 'نوع الصفقة', enum: ['BUY', 'SELL'], example: 'BUY' })
  @IsString()
  @IsIn(['BUY', 'SELL'], { message: 'نوع الصفقة يجب أن يكون إما BUY أو SELL' })
  type: 'BUY' | 'SELL';

  @ApiProperty({ description: 'حجم العقد باللوت', example: 0.1 })
  @IsNumber()
  @Min(0.01, { message: 'أقل لوت هو 0.01' })
  @Max(100.0, { message: 'أقصى لوت هو 100.0' })
  lots: number;

  @ApiPropertyOptional({ description: 'سعر التنفيذ المطلوب للمحاكاة', example: 1.0850 })
  @IsNumber()
  @IsOptional()
  executionPrice?: number;

  @ApiPropertyOptional({ description: 'وقف الخسارة Stop Loss', example: 1.0800 })
  @IsNumber()
  @IsOptional()
  stopLoss?: number;

  @ApiPropertyOptional({ description: 'جني الأرباح Take Profit', example: 1.0950 })
  @IsNumber()
  @IsOptional()
  takeProfit?: number;
}

export class ClosePositionDto {
  @ApiPropertyOptional({ description: 'سعر الإغلاق للمحاكاة', example: 1.0910 })
  @IsNumber()
  @IsOptional()
  closePrice?: number;

  @ApiPropertyOptional({ description: 'سبب الإغلاق', example: 'MANUAL' })
  @IsString()
  @IsOptional()
  reason?: string;
}

export class ModifyPositionDto {
  @ApiPropertyOptional({ description: 'وقف الخسارة الجديد', example: 1.0820 })
  @IsNumber()
  @IsOptional()
  stopLoss?: number;

  @ApiPropertyOptional({ description: 'جني الأرباح الجديد', example: 1.0980 })
  @IsNumber()
  @IsOptional()
  takeProfit?: number;
}

export class CreateCompetitionPlanDto {
  @ApiProperty({ description: 'عنوان الباقة بالعربية', example: 'باقة أكاديمية المتداول ($10,000)' })
  @IsString()
  @IsNotEmpty()
  titleAr: string;

  @ApiProperty({ description: 'عنوان الباقة بالإنجليزية', example: 'Academy Trader ($10,000)' })
  @IsString()
  @IsNotEmpty()
  titleEn: string;

  @ApiPropertyOptional({ description: 'نوع المنتج المرتبط به', enum: ProductType })
  @IsEnum(ProductType)
  @IsOptional()
  targetProductType?: ProductType;

  @ApiPropertyOptional({ description: 'معرف الكورس أو خطة الاشتراك' })
  @IsString()
  @IsOptional()
  targetProductId?: string;

  @ApiProperty({ description: 'الرصيد التجريبي الابتدائي بالدولار', example: 10000 })
  @IsNumber()
  @Min(1000)
  initialBalance: number;

  @ApiPropertyOptional({ description: 'الرافعة المالية', example: 100 })
  @IsNumber()
  @IsOptional()
  leverage?: number;

  @ApiPropertyOptional({ description: 'اسم سيرفر الوسيط', example: 'FXENGIN Prime ECN' })
  @IsString()
  @IsOptional()
  brokerServer?: string;

  @ApiPropertyOptional({ description: 'أقصى تراجع يومي مسموح به %', example: 5.0 })
  @IsNumber()
  @IsOptional()
  maxDailyDrawdown?: number;

  @ApiPropertyOptional({ description: 'أقصى تراجع إجمالي مسموح به %', example: 10.0 })
  @IsNumber()
  @IsOptional()
  maxTotalDrawdown?: number;

  @ApiPropertyOptional({ description: 'مضاعف نقاط المسابقة لكل نقطة ربح', example: 1.0 })
  @IsNumber()
  @IsOptional()
  pointsPerPip?: number;

  @ApiPropertyOptional({ description: 'اسم شارة المتسابق', example: 'PRO TRADER' })
  @IsString()
  @IsOptional()
  badgeName?: string;

  @ApiPropertyOptional({ description: 'وصف الباقة بالعربية' })
  @IsString()
  @IsOptional()
  descriptionAr?: string;

  @ApiPropertyOptional({ description: 'وصف الباقة بالإنجليزية' })
  @IsString()
  @IsOptional()
  descriptionEn?: string;
}

export class UpdateCompetitionPlanDto extends CreateCompetitionPlanDto {}

export class CreateManualParticipantDto {
  @ApiProperty({ description: 'اسم المتسابق الكامل', example: 'أحمد محمود' })
  @IsString()
  @IsNotEmpty({ message: 'اسم المتسابق مطلوب' })
  fullName: string;

  @ApiProperty({ description: 'البريد الإلكتروني للمتسابق', example: 'trader@company.com' })
  @IsString()
  @IsNotEmpty({ message: 'البريد الإلكتروني مطلوب' })
  email: string;

  @ApiPropertyOptional({ description: 'رقم الهاتف أو الواتساب', example: '+966501234567' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ description: 'رقم الحساب التجريبي أو التداول', example: '500201' })
  @IsString()
  @IsOptional()
  accountNumber?: string;

  @ApiPropertyOptional({ description: 'معرف باقة المسابقة', example: 'cmu...' })
  @IsString()
  @IsOptional()
  planId?: string;

  @ApiPropertyOptional({ description: 'اسم سيرفر أو وسيط الشركة', example: 'FXENGIN Prime ECN' })
  @IsString()
  @IsOptional()
  brokerServer?: string;

  @ApiProperty({ description: 'الرصيد الابتدائي للحساب', example: 25000 })
  @IsNumber()
  @Min(100)
  initialBalance: number;

  @ApiPropertyOptional({ description: 'الرصيد الحالي للمتسابق', example: 28500 })
  @IsNumber()
  @IsOptional()
  balance?: number;

  @ApiPropertyOptional({ description: 'السيولة الحالية (Equity)', example: 28500 })
  @IsNumber()
  @IsOptional()
  equity?: number;

  @ApiPropertyOptional({ description: 'الرافعة المالية', example: 100 })
  @IsNumber()
  @IsOptional()
  leverage?: number;

  @ApiPropertyOptional({ description: 'مجموع النقاط في لوحة المتصدرين', example: 1850 })
  @IsNumber()
  @IsOptional()
  points?: number;

  @ApiPropertyOptional({ description: 'إجمالي نقاط البيب (Total Pips)', example: 120 })
  @IsNumber()
  @IsOptional()
  totalPips?: number;

  @ApiPropertyOptional({ description: 'إجمالي عدد الصفقات المنفذة', example: 15 })
  @IsNumber()
  @IsOptional()
  totalTrades?: number;

  @ApiPropertyOptional({ description: 'عدد الصفقات الرابحة', example: 12 })
  @IsNumber()
  @IsOptional()
  winTrades?: number;

  @ApiPropertyOptional({ description: 'عدد الصفقات الخاسرة', example: 3 })
  @IsNumber()
  @IsOptional()
  lossTrades?: number;

  @ApiPropertyOptional({ description: 'حالة الحساب', example: 'ACTIVE' })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({ description: 'هل هو مشترك مباشر عبر الشركة', example: true })
  @IsOptional()
  isCompanyDirect?: boolean;

  @ApiPropertyOptional({ description: 'ملاحظات إضافية' })
  @IsString()
  @IsOptional()
  note?: string;
}

export class UpdateManualParticipantDto {
  @ApiPropertyOptional({ description: 'اسم المتسابق الكامل' })
  @IsString()
  @IsOptional()
  fullName?: string;

  @ApiPropertyOptional({ description: 'البريد الإلكتروني' })
  @IsString()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ description: 'معرف باقة المسابقة' })
  @IsString()
  @IsOptional()
  planId?: string;

  @ApiPropertyOptional({ description: 'اسم سيرفر أو وسيط الشركة' })
  @IsString()
  @IsOptional()
  brokerServer?: string;

  @ApiPropertyOptional({ description: 'الرصيد الابتدائي' })
  @IsNumber()
  @IsOptional()
  initialBalance?: number;

  @ApiPropertyOptional({ description: 'الرصيد الحالي' })
  @IsNumber()
  @IsOptional()
  balance?: number;

  @ApiPropertyOptional({ description: 'السيولة الحالية' })
  @IsNumber()
  @IsOptional()
  equity?: number;

  @ApiPropertyOptional({ description: 'الرافعة المالية' })
  @IsNumber()
  @IsOptional()
  leverage?: number;

  @ApiPropertyOptional({ description: 'مجموع النقاط' })
  @IsNumber()
  @IsOptional()
  points?: number;

  @ApiPropertyOptional({ description: 'إجمالي نقاط البيب' })
  @IsNumber()
  @IsOptional()
  totalPips?: number;

  @ApiPropertyOptional({ description: 'إجمالي عدد الصفقات' })
  @IsNumber()
  @IsOptional()
  totalTrades?: number;

  @ApiPropertyOptional({ description: 'عدد الصفقات الرابحة' })
  @IsNumber()
  @IsOptional()
  winTrades?: number;

  @ApiPropertyOptional({ description: 'عدد الصفقات الخاسرة' })
  @IsNumber()
  @IsOptional()
  lossTrades?: number;

  @ApiPropertyOptional({ description: 'حالة الحساب' })
  @IsString()
  @IsOptional()
  status?: string;
}

