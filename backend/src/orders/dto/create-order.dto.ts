import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProductType, PaymentMethodType } from '@prisma/client';

export class CreateOrderDto {
  @ApiProperty({ enum: ProductType, description: 'نوع المنتج (RECORDED_COURSE, LIVE_COURSE, COMMUNITY_GROUP)' })
  @IsEnum(ProductType)
  @IsNotEmpty()
  productType: ProductType;

  @ApiProperty({ description: 'معرف أو slug المنتج (Course ID, LiveSession ID, SubscriptionPlan ID/slug)' })
  @IsString()
  @IsNotEmpty()
  productId: string;

  @ApiPropertyOptional({ enum: PaymentMethodType, description: 'طريقة الدفع المختارة' })
  @IsEnum(PaymentMethodType)
  @IsOptional()
  paymentMethod?: PaymentMethodType;

  @ApiPropertyOptional({ description: 'كود خصم اختياري' })
  @IsString()
  @IsOptional()
  couponCode?: string;

  @ApiPropertyOptional({ description: 'ملاحظات العميل' })
  @IsString()
  @IsOptional()
  customerNotes?: string;

  @ApiPropertyOptional({ description: 'بريد العميل (للطلبات بدون تسجيل مسبق)' })
  @IsString()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ description: 'اسم العميل' })
  @IsString()
  @IsOptional()
  fullName?: string;

  @ApiPropertyOptional({ description: 'رقم هاتف العميل' })
  @IsString()
  @IsOptional()
  phone?: string;
}
