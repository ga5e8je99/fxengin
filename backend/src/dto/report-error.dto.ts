import { IsNotEmpty, IsString, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum ClientErrorCode {
  NOT_FOUND_404 = '404',
  UNAUTHORIZED_401 = '401',
  FORBIDDEN_403 = '403',
  INTERNAL_ERROR_500 = '500',
  GATEWAY_OFFLINE_503 = '503',
}

export class ReportErrorDto {
  @ApiProperty({
    enum: ClientErrorCode,
    example: ClientErrorCode.NOT_FOUND_404,
    description: 'HTTP status error code encountered on client',
  })
  @IsEnum(ClientErrorCode)
  @IsNotEmpty()
  errorCode: ClientErrorCode;

  @ApiProperty({
    example: '/marketplace/bot-unknown-id',
    description: 'URL path or broken endpoint where the error occurred',
  })
  @IsString()
  @IsNotEmpty()
  path: string;

  @ApiPropertyOptional({
    example: 'Route not found in Next.js router',
    description: 'Optional technical message or stack snippet',
  })
  @IsOptional()
  @IsString()
  message?: string;

  @ApiPropertyOptional({
    example: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    description: 'Client browser user-agent header',
  })
  @IsOptional()
  @IsString()
  userAgent?: string;
}
