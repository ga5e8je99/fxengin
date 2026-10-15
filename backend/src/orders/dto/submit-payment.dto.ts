import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentMethodType } from '@prisma/client';

export class SubmitPaymentDto {
  @ApiPropertyOptional({ enum: PaymentMethodType, description: 'طريقة الدفع' })
  @IsEnum(PaymentMethodType)
  @IsOptional()
  paymentMethod?: PaymentMethodType;

  @ApiPropertyOptional({ description: 'رقم أو هاش المعاملة الشبكية (TxID / TxHash)' })
  @IsString()
  @IsOptional()
  txId?: string;

  @ApiPropertyOptional({ description: 'رابط صورة إيصال التحويل' })
  @IsString()
  @IsOptional()
  paymentProofUrl?: string;

  @ApiPropertyOptional({ description: 'ملاحظات العميل الإضافية' })
  @IsString()
  @IsOptional()
  customerNotes?: string;
}
