import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateCmsPageDto {
  @ApiPropertyOptional({ example: 'عن FXENGIN' })
  @IsOptional()
  @IsString()
  titleAr?: string;

  @ApiPropertyOptional({ example: 'About FXENGIN' })
  @IsOptional()
  @IsString()
  titleEn?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  subtitleAr?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  subtitleEn?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  badgeAr?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  badgeEn?: string;

  @ApiPropertyOptional({ example: 'company' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional()
  @IsOptional()
  contentData?: any;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}
