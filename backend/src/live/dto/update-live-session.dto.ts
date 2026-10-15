import { PartialType } from '@nestjs/swagger';
import { CreateLiveSessionDto } from './create-live-session.dto';
import { IsEnum, IsOptional, IsBoolean, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { LiveSessionStatus } from '@prisma/client';

export class UpdateLiveSessionDto extends PartialType(CreateLiveSessionDto) {
  @ApiPropertyOptional({ enum: LiveSessionStatus, description: 'حالة البث الحالية' })
  @IsEnum(LiveSessionStatus)
  @IsOptional()
  status?: LiveSessionStatus;

  @ApiPropertyOptional({ description: 'هل التسجيل متاح بعد انتهاء البث المباشر' })
  @IsBoolean()
  @IsOptional()
  isRecordingAvailable?: boolean;

  @ApiPropertyOptional({ description: 'رابط تسجيل الجلسة' })
  @IsString()
  @IsOptional()
  replayUrl?: string;
}
