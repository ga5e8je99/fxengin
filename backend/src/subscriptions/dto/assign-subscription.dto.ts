import { IsString, IsNotEmpty, IsOptional, IsNumber, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AssignSubscriptionDto {
  @ApiProperty({
    example: 'user_cuid_123 or trader@example.com',
    description: 'معرف المستخدم (User ID) أو بريده الإلكتروني المراد منح الاشتراك له',
  })
  @IsString()
  @IsNotEmpty({ message: 'معرف المستخدم أو البريد الإلكتروني مطلوب' })
  userIdentifier: string;

  @ApiProperty({
    example: 'plan_cuid_456 or bot-signals-pro',
    description: 'معرف الباقة (Plan ID) أو الـ slug المراد تفعيلها له',
  })
  @IsString()
  @IsNotEmpty({ message: 'معرف الباقة مطلوب' })
  planIdentifier: string;

  @ApiPropertyOptional({
    example: 30,
    default: 30,
    description: 'مدة صلاحية الاشتراك بالأيام (مثلاً 30 يوم، 365 يوم، أو 0 لمدى الحياة)',
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  durationDays?: number;

  @ApiPropertyOptional({
    example: 'ADMIN_MANUAL_PROVISION',
    description: 'ملاحظة أو مرجع المنح (سبب المنح الإداري)',
  })
  @IsString()
  @IsOptional()
  paymentReference?: string;
}
