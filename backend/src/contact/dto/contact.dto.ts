import { IsString, IsNotEmpty, IsEmail, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MessageStatus } from '@prisma/client';

export class CreateContactMessageDto {
  @ApiPropertyOptional({ example: 'أحمد محمد', description: 'الاسم الكامل للراسل' })
  @IsOptional()
  @IsString()
  fullName?: string;

  @ApiPropertyOptional({ example: 'أحمد محمد' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ example: 'ahmed@example.com', description: 'البريد الإلكتروني' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiPropertyOptional({ example: '+971501234567', description: 'رقم الهاتف أو الواتساب' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'support', description: 'قسم الاستفسار: support, partnership, billing, academy' })
  @IsOptional()
  @IsString()
  topic?: string;

  @ApiPropertyOptional({ example: 'استفسار عن باقات VIP', description: 'موضوع الرسالة' })
  @IsOptional()
  @IsString()
  subject?: string;

  @ApiProperty({ example: 'مرحباً، أود الاستفسار عن تفاصيل الاشتراك في باقة الذهب VIP', description: 'نص الرسالة' })
  @IsString()
  @IsNotEmpty()
  message: string;
}

export class UpdateContactStatusDto {
  @ApiProperty({ enum: MessageStatus })
  @IsEnum(MessageStatus)
  status: MessageStatus;

  @ApiPropertyOptional({ description: 'ملاحظات الإدارة حول الرد' })
  @IsOptional()
  @IsString()
  replyNote?: string;
}
