import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class AdminRegisterDto {
  @ApiProperty({
    example: 'Eng. Gamal Ahmed',
    description: 'Full name of the new administrator',
  })
  @IsString()
  @IsNotEmpty({ message: 'Full name is required' })
  fullName: string;

  @ApiProperty({
    example: 'trader.admin@fxengen.com',
    description: 'Corporate administrator email address',
  })
  @IsEmail({}, { message: 'Please provide a valid administrator email' })
  @IsNotEmpty({ message: 'Administrator email is required' })
  email: string;

  @ApiProperty({
    example: 'FXMaster#2026!SecureAdminPass',
    description: 'Master administrator password (min 8 chars)',
    minLength: 8,
  })
  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  password: string;

  @ApiPropertyOptional({
    example: '+201012345678',
    description: 'Contact phone number (optional)',
  })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiPropertyOptional({
    example: 'FXENGIN_ADMIN_2026',
    description: 'Administrative Security Authorization Passcode',
  })
  @IsOptional()
  @IsString()
  securityPasscode?: string;
}
