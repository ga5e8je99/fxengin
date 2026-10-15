import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateAdSenseConfigDto {
  @ApiPropertyOptional({ description: 'تفعيل إعلانات جوجل AdSense على المنصة', example: true })
  @IsBoolean()
  @IsOptional()
  isEnabled?: boolean;

  @ApiPropertyOptional({
    description: 'معرف الناشر في جوجل AdSense (Publisher ID)',
    example: 'ca-pub-1234567890123456',
  })
  @IsString()
  @IsOptional()
  publisherId?: string;

  @ApiPropertyOptional({
    description: 'تفعيل الإعلانات التلقائية من جوجل (Auto Ads)',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  autoAds?: boolean;

  @ApiPropertyOptional({
    description: 'معرف الوحدة الإعلانية للبمر الأفقي (Horizontal Banner Slot ID)',
    example: '1234567890',
  })
  @IsString()
  @IsOptional()
  slotHorizontal?: string;

  @ApiPropertyOptional({
    description: 'معرف الوحدة الإعلانية للشريط الأيمن (Right Skyscraper Slot ID)',
    example: '2345678901',
  })
  @IsString()
  @IsOptional()
  slotRightBar?: string;

  @ApiPropertyOptional({
    description: 'معرف الوحدة الإعلانية للشريط الأيسر (Left Skyscraper Slot ID)',
    example: '3456789012',
  })
  @IsString()
  @IsOptional()
  slotLeftBar?: string;

  @ApiPropertyOptional({
    description: 'معرف الوحدة الإعلانية لشريط الموبايل (Mobile Top Bar Slot ID)',
    example: '4567890123',
  })
  @IsString()
  @IsOptional()
  slotMobileBar?: string;

  @ApiPropertyOptional({
    description: 'أسطر مخصصة إضافية لملف ads.txt',
    example: '',
  })
  @IsString()
  @IsOptional()
  adsTxtCustom?: string;

  @ApiPropertyOptional({
    description: 'تفعيل وضع الاختبار (Test Mode - data-adtest="on")',
    example: false,
  })
  @IsBoolean()
  @IsOptional()
  testMode?: boolean;
}
