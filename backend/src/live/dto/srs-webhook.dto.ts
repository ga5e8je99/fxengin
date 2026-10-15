import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';

export class SrsWebhookOnPublishDto {
  @ApiProperty({ description: 'نوع الحدث في خادم الوسائط', example: 'on_publish' })
  @IsString()
  @IsNotEmpty()
  action: string;

  @ApiProperty({ description: 'معرف عميل الدفق في خادم SRS', example: 101 })
  @IsOptional()
  client_id?: number | string;

  @ApiProperty({ description: 'عنوان IP الخاص بالمذيع / المحاضر', example: '186.240.145.87' })
  @IsOptional()
  @IsString()
  ip?: string;

  @ApiProperty({ description: 'المضيف الافتراضي', example: '__defaultVhost__' })
  @IsOptional()
  @IsString()
  vhost?: string;

  @ApiProperty({ description: 'اسم التطبيق في بروتوكول RTMP', example: 'live' })
  @IsString()
  @IsNotEmpty()
  app: string;

  @ApiProperty({ description: 'معرف الدفق أو مفتاح البث (Stream Name / Stream Key)', example: 'fx_live_9a8b7c6d' })
  @IsString()
  @IsNotEmpty()
  stream: string;

  @ApiProperty({ description: 'المعلمات الإضافية المرفقة بالرابط', example: '?secret=xxx', required: false })
  @IsOptional()
  @IsString()
  param?: string;
}

export class SrsWebhookOnUnpublishDto {
  @ApiProperty({ description: 'نوع الحدث في خادم الوسائط', example: 'on_unpublish' })
  @IsString()
  @IsNotEmpty()
  action: string;

  @ApiProperty({ description: 'معرف العميل', example: 101 })
  @IsOptional()
  client_id?: number | string;

  @ApiProperty({ description: 'عنوان IP المذيع', example: '186.240.145.87' })
  @IsOptional()
  @IsString()
  ip?: string;

  @ApiProperty({ description: 'اسم التطبيق', example: 'live' })
  @IsString()
  @IsNotEmpty()
  app: string;

  @ApiProperty({ description: 'مفتاح البث / اسم الدفق', example: 'fx_live_9a8b7c6d' })
  @IsString()
  @IsNotEmpty()
  stream: string;
}

export class SrsWebhookOnDvrDto {
  @ApiProperty({ description: 'نوع الحدث', example: 'on_dvr' })
  @IsString()
  @IsNotEmpty()
  action: string;

  @ApiProperty({ description: 'معرف العميل', example: 101 })
  @IsOptional()
  client_id?: number | string;

  @ApiProperty({ description: 'اسم التطبيق', example: 'live' })
  @IsString()
  @IsNotEmpty()
  app: string;

  @ApiProperty({ description: 'مفتاح البث', example: 'fx_live_9a8b7c6d' })
  @IsString()
  @IsNotEmpty()
  stream: string;

  @ApiProperty({ description: 'المسار الكامل لملف التسجيل الناتج MP4 على السيرفر', example: '/usr/local/srs/objs/nginx/html/live/session.mp4' })
  @IsString()
  @IsNotEmpty()
  file: string;
}
