import { IsEmail, IsNotEmpty, IsString, Length, MinLength, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty({
    example: 'trader@fxengin.com',
    description: 'البريد الإلكتروني للمستخدم المراد استعادة كلمة مروره',
  })
  @IsEmail({}, { message: 'يرجى إدخال بريد إلكتروني صحيح' })
  email: string;

  @ApiProperty({
    example: '849201',
    description: 'رمز التحقق (OTP) المكون من 6 أرقام المرسل للبريد',
  })
  @IsString()
  @IsNotEmpty({ message: 'رمز التحقق مطلوب' })
  @Length(6, 6, { message: 'يجب أن يتكون رمز التحقق من 6 أرقام' })
  otp: string;

  @ApiProperty({
    example: 'NewPassword#2026',
    description: 'كلمة المرور الجديدة (8 أحرف على الأقل)',
  })
  @IsString()
  @MinLength(8, { message: 'يجب ألا تقل كلمة المرور الجديدة عن 8 أحرف' })
  password: string;

  @ApiPropertyOptional({
    example: 'NewPassword#2026',
    description: 'تأكيد كلمة المرور الجديدة',
  })
  @IsOptional()
  @IsString()
  confirmPassword?: string;
}
