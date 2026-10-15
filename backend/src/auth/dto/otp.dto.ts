import { IsEmail, IsNotEmpty, IsString, Length, IsOptional, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SendOtpDto {
  @ApiProperty({
    example: 'user@gmail.com',
    description: 'Email address to receive the verification OTP',
  })
  @IsEmail({}, { message: 'يرجى إدخال بريد إلكتروني صحيح' })
  email: string;

  @ApiPropertyOptional({
    example: 'LOGIN',
    description: 'Purpose of the OTP (LOGIN, REGISTER, or RESET_PASSWORD)',
    default: 'LOGIN',
  })
  @IsOptional()
  @IsIn(['LOGIN', 'REGISTER', 'RESET_PASSWORD'], { message: 'الغرض من الرمز غير صالح' })
  purpose?: 'LOGIN' | 'REGISTER' | 'RESET_PASSWORD';
}

export class VerifyOtpDto {
  @ApiProperty({
    example: 'user@gmail.com',
    description: 'Email address associated with the OTP',
  })
  @IsEmail({}, { message: 'يرجى إدخال بريد إلكتروني صحيح' })
  email: string;

  @ApiProperty({
    example: '849201',
    description: '6-digit OTP code received in email',
  })
  @IsString()
  @IsNotEmpty({ message: 'كود التحقق مطلوب' })
  @Length(6, 6, { message: 'يجب أن يتكون كود التحقق من 6 أرقام' })
  code: string;

  @ApiPropertyOptional({
    example: 'LOGIN',
    description: 'Purpose of the OTP',
    default: 'LOGIN',
  })
  @IsOptional()
  @IsIn(['LOGIN', 'REGISTER', 'RESET_PASSWORD'], { message: 'الغرض من الرمز غير صالح' })
  purpose?: 'LOGIN' | 'REGISTER' | 'RESET_PASSWORD';
}

export class LoginOtpDto {
  @ApiProperty({
    example: 'user@gmail.com',
    description: 'User email address',
  })
  @IsEmail({}, { message: 'يرجى إدخال بريد إلكتروني صحيح' })
  email: string;

  @ApiProperty({
    example: '849201',
    description: '6-digit OTP code',
  })
  @IsString()
  @IsNotEmpty({ message: 'كود التحقق مطلوب' })
  @Length(6, 6, { message: 'يجب أن يتكون كود التحقق من 6 أرقام' })
  code: string;
}
