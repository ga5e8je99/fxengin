import { IsString, IsNotEmpty, IsOptional, IsInt, Min, Max, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTestimonialDto {
  @ApiProperty({ example: 'م. فيصل القحطاني', description: 'اسم المتداول / العميل' })
  @IsString()
  @IsNotEmpty()
  clientName: string;

  @ApiPropertyOptional({ example: 'الرياض، السعودية 🇸🇦' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ example: 'متداول VIP معتمد' })
  @IsOptional()
  @IsString()
  roleTitle?: string;

  @ApiPropertyOptional({ example: 'FQ' })
  @IsOptional()
  @IsString()
  avatarText?: string;

  @ApiPropertyOptional({ example: 'webinars', description: 'webinars, funding, analytics, courses' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiProperty({ example: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiPropertyOptional({ example: '+34% نمو المحفظة في شهرين' })
  @IsOptional()
  @IsString()
  metricText?: string;

  @ApiProperty({ example: 'حضور ورشة السيولة البنكية غير طريقة نظرتي للشارت تماماً...' })
  @IsString()
  @IsNotEmpty()
  reviewAr: string;

  @ApiPropertyOptional({ example: 'Attending the institutional liquidity workshop...' })
  @IsOptional()
  @IsString()
  reviewEn?: string;

  @ApiPropertyOptional({ example: 'ورشة السيولة البنكية المباشرة (SMC)' })
  @IsOptional()
  @IsString()
  courseName?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isApproved?: boolean;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  sortOrder?: number;
}

export class UpdateTestimonialDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  clientName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  roleTitle?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  avatarText?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  metricText?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reviewAr?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reviewEn?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  courseName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isApproved?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  sortOrder?: number;
}
