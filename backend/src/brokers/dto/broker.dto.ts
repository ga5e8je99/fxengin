import { IsString, IsNotEmpty, IsOptional, IsNumber, IsBoolean, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBrokerDto {
  @ApiProperty({ example: 'xm-global' })
  @IsString()
  @IsNotEmpty()
  brokerSlug: string;

  @ApiProperty({ example: 'XM Global' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: 'forex', description: 'forex or prop' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ example: 'وسيط فوركس وعقود فروقات مرخص' })
  @IsOptional()
  @IsString()
  categoryLabelAr?: string;

  @ApiPropertyOptional({ example: 'Regulated Forex & CFD Broker' })
  @IsOptional()
  @IsString()
  categoryLabelEn?: string;

  @ApiPropertyOptional({ example: 'وسيط معتمد وموثوق' })
  @IsOptional()
  @IsString()
  badgeAr?: string;

  @ApiPropertyOptional({ example: 'Verified Official Partner' })
  @IsOptional()
  @IsString()
  badgeEn?: string;

  @ApiPropertyOptional({ example: '#0488F8' })
  @IsOptional()
  @IsString()
  badgeColor?: string;

  @ApiPropertyOptional({ example: '/assets/Images/brokers/xm.png' })
  @IsOptional()
  @IsString()
  logoUrl?: string;

  @ApiPropertyOptional({ example: '#000000' })
  @IsOptional()
  @IsString()
  logoBg?: string;

  @ApiPropertyOptional({ example: 4.9 })
  @IsOptional()
  @IsNumber()
  rating?: number;

  @ApiPropertyOptional({ example: '10M+ متداول' })
  @IsOptional()
  @IsString()
  clientsCount?: string;

  @ApiPropertyOptional({ example: '10M+ Traders' })
  @IsOptional()
  @IsString()
  clientsCountEn?: string;

  @ApiPropertyOptional({ example: '#10B981' })
  @IsOptional()
  @IsString()
  accentColor?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  glowBorder?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  descriptionAr?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  descriptionEn?: string;

  @ApiPropertyOptional()
  @IsOptional()
  specsData?: any;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  featuresAr?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  featuresEn?: string[];

  @ApiPropertyOptional({ example: 'KTW63' })
  @IsOptional()
  @IsString()
  couponCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  perksAr?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  perksEn?: string;

  @ApiPropertyOptional({ default: '#' })
  @IsOptional()
  @IsString()
  liveUrl?: string;

  @ApiPropertyOptional({ default: '#' })
  @IsOptional()
  @IsString()
  demoUrl?: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsNumber()
  sortOrder?: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  logo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  specs?: any;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  fxenginPerksAr?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  fxenginPerksEn?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  slug?: string;
}

export class UpdateBrokerDto extends CreateBrokerDto {}
