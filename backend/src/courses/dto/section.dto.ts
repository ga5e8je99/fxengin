import { IsString, IsNotEmpty, IsOptional, IsInt, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSectionDto {
  @ApiProperty({ description: 'عنوان القسم أو الفصل التدريبي', example: 'الفصل الأول: البنية الهيكلية وتدفق السيولة' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ description: 'وصف مختصر للقسم ومحاوره' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'ترتيب عرض القسم في المنهاج', example: 1, default: 0 })
  @IsInt()
  @Min(0)
  @IsOptional()
  orderIndex?: number;
}

export class UpdateSectionDto {
  @ApiPropertyOptional({ description: 'عنوان القسم أو الفصل التدريبي' })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({ description: 'وصف مختصر للقسم' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'ترتيب عرض القسم' })
  @IsInt()
  @Min(0)
  @IsOptional()
  orderIndex?: number;
}
