import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MinLength } from 'class-validator';

export class AdminResetPasswordDto {
  @ApiPropertyOptional({
    example: 'NewSecret#2026!PassSecure',
    description: 'Explicit new password to assign. If omitted or generateRandom is true, system generates a secure one.',
    minLength: 8,
  })
  @IsOptional()
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  newPassword?: string;

  @ApiPropertyOptional({
    example: false,
    description: 'Whether to auto-generate a high-entropy random password',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  generateRandom?: boolean;
}
