import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateStatusDto {
  @ApiProperty({
    example: false,
    description: 'Account active flag (false = suspended/banned, true = active)',
  })
  @IsBoolean()
  @IsNotEmpty()
  isActive: boolean;

  @ApiPropertyOptional({
    example: 'Suspicious bot trading activity detected from unauthorized country',
    description: 'Administrative audit reason for suspension or reactivation',
  })
  @IsOptional()
  @IsString()
  reason?: string;
}
