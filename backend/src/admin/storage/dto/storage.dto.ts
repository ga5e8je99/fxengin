import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GeneratePresignedUrlDto {
  @ApiProperty({ description: 'اسم الملف المراد رفعه مع الامتداد', example: 'lecture-01-order-blocks.mp4' })
  @IsString()
  @IsNotEmpty()
  fileName: string;

  @ApiProperty({ description: 'نوع المحتوى MIME type', example: 'video/mp4' })
  @IsString()
  @IsNotEmpty()
  contentType: string;

  @ApiPropertyOptional({ description: 'المجلد الفرعي في السحابة (courses, pdfs, thumbnails)', default: 'courses' })
  @IsString()
  @IsOptional()
  folder?: string;
}

export class ValidateExternalLinkDto {
  @ApiProperty({ description: 'رابط الفيديو أو الملف السحابي الخارجي للتحقق منه', example: 'https://storage.fxengen.com/courses/c1/intro.mp4' })
  @IsString()
  @IsNotEmpty()
  url: string;
}
