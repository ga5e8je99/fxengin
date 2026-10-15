import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class AdminLoginDto {
  @ApiProperty({
    example: 'admin@fxengen.com',
    description: 'Registered Super Administrator email address',
  })
  @IsEmail({}, { message: 'Please provide a valid administrator email' })
  @IsNotEmpty({ message: 'Administrator email is required' })
  email: string;

  @ApiProperty({
    example: 'FXAdmin#2026!MasterEngine$SecureKey',
    description: 'High-entropy master administrator password',
    minLength: 12,
  })
  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(12, { message: 'Admin password must be at least 12 characters' })
  password: string;
}
