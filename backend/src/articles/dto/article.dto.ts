import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsInt, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateArticleDto {
  @ApiProperty({ example: 'استراتيجية تداول الذهب بمناطق السيولة البنكية' })
  @IsString()
  @IsNotEmpty()
  titleAr: string;

  @ApiPropertyOptional({ example: 'Gold Institutional Trading Strategy' })
  @IsOptional()
  @IsString()
  titleEn?: string;

  @ApiPropertyOptional({ example: 'gold-liquidity-strategy' })
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  excerptAr?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  excerptEn?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  contentAr?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  contentEn?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  coverImage?: string;

  @ApiPropertyOptional({ default: 'م. سليمان داود' })
  @IsOptional()
  @IsString()
  authorName?: string;

  @ApiPropertyOptional({ default: 'strategies' })
  @IsOptional()
  @IsString()
  categoryKey?: string;

  @ApiPropertyOptional({ default: 'استراتيجيات التداول' })
  @IsOptional()
  @IsString()
  categoryAr?: string;

  @ApiPropertyOptional({ default: 'Trading Strategies' })
  @IsOptional()
  @IsString()
  categoryEn?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  tags?: string[];

  @ApiPropertyOptional({ default: 5 })
  @IsOptional()
  @IsInt()
  readTimeMinutes?: number;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @ApiPropertyOptional({ default: 'PUBLISHED' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  tradingViewUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  symbol?: string;

  @ApiPropertyOptional()
  @IsOptional()
  sectionsData?: any;

  @ApiPropertyOptional()
  @IsOptional()
  faqsData?: any;
}

export class UpdateArticleDto extends CreateArticleDto {}
