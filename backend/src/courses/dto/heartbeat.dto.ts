import { IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class WatchHeartbeatDto {
  @ApiProperty({ description: 'الموقع الزمني الحالي لمؤشر التشغيل بالثواني', example: 145 })
  @IsNumber()
  @Min(0)
  currentTime: number;

  @ApiProperty({ description: 'عدد الثواني الفعلية التي تمت مشاهدتها منذ آخر نبضة (بحد أقصى 30 ثانية)', example: 10 })
  @IsNumber()
  @Min(1)
  @Max(60)
  deltaSeconds: number;

  @ApiPropertyOptional({ description: 'معرف جلسة المشاهدة الآمنة', example: 'sess_watch_98234' })
  @IsString()
  @IsOptional()
  sessionToken?: string;
}
