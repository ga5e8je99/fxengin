import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';

export class ValidateCouponDto {
  @ApiProperty({ description: 'كود الخصم المراد فحصه', example: 'FX20' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiPropertyOptional({ description: 'المبلغ الأصلي قبل الخصم', example: 199 })
  @IsOptional()
  @IsNumber()
  amount?: number;

  @ApiPropertyOptional({ description: 'معرف أو slug الكورس أو العنصر المراد شراؤه' })
  @IsOptional()
  @IsString()
  courseId?: string;
}
