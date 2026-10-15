import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsEmail } from 'class-validator';

export enum SocialAuthProvider {
  GOOGLE = 'GOOGLE',
  APPLE = 'APPLE',
}

export class SocialAuthDto {
  @ApiProperty({
    description: 'مزود خدمة تسجيل الدخول الاجتماعي (GOOGLE أو APPLE)',
    enum: SocialAuthProvider,
    example: SocialAuthProvider.GOOGLE,
  })
  @IsEnum(SocialAuthProvider)
  @IsNotEmpty()
  provider: SocialAuthProvider;

  @ApiPropertyOptional({
    description: 'رمز التحقق الصادر من Google أو Apple (ID Token أو Identity Token)',
    example: 'eyJhbGciOiJSUzI1NiIsImtpZCI6...',
  })
  @IsString()
  @IsOptional()
  idToken?: string;

  @ApiPropertyOptional({
    description: 'كود المصادقة (Authorization Code) في حال استخدام تدفق OAuth المباشر',
  })
  @IsString()
  @IsOptional()
  authorizationCode?: string;

  @ApiPropertyOptional({
    description: 'البريد الإلكتروني في حال تم تمريره مباشرة من المصادقة',
    example: 'trader@gmail.com',
  })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({
    description: 'الاسم الكامل للمستخدم',
    example: 'Alex Morgan',
  })
  @IsString()
  @IsOptional()
  fullName?: string;
}
