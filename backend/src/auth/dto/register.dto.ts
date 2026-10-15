import { IsEmail, IsNotEmpty, IsString, MinLength, MaxLength, Matches, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum ExperienceLevel {
  BEGINNER = 'BEGINNER',
  INTERMEDIATE = 'INTERMEDIATE',
  ADVANCED = 'ADVANCED',
}

export class RegisterDto {
  @ApiProperty({
    example: 'trader@fxengin.com',
    description: 'User email address for account credentials',
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;

  @ApiProperty({
    example: 'Johnathan Vance',
    description: 'Full legal name of the trader',
  })
  @IsString()
  @IsNotEmpty({ message: 'Full name is required' })
  @MinLength(3, { message: 'Full name must be at least 3 characters' })
  @MaxLength(70, { message: 'Full name cannot exceed 70 characters' })
  fullName: string;

  @ApiPropertyOptional({
    example: '+1 (555) 234-5678',
    description: 'Optional contact phone number',
  })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiPropertyOptional({
    enum: ExperienceLevel,
    example: ExperienceLevel.INTERMEDIATE,
    description: 'Forex & financial market trading experience level',
    default: ExperienceLevel.BEGINNER,
  })
  @IsOptional()
  @IsEnum(ExperienceLevel, { message: 'Experience level must be BEGINNER, INTERMEDIATE, or ADVANCED' })
  experienceLevel?: ExperienceLevel;

  @ApiPropertyOptional({
    example: '1995-06-15',
    description: 'Optional date of birth',
  })
  @IsOptional()
  @IsString()
  dateOfBirth?: string;

  @ApiProperty({
    example: 'Password123!',
    description: 'Secure password (min 8 chars, 1 uppercase, 1 lowercase, 1 number/special)',
  })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message: 'Password must contain at least 1 uppercase letter, 1 lowercase letter, and 1 number or special character',
  })
  password: string;

  @ApiProperty({
    example: 'Password123!',
    description: 'Matching confirmation password',
  })
  @IsString()
  @IsNotEmpty({ message: 'Confirm password is required' })
  confirmPassword: string;

  @ApiPropertyOptional({
    example: '849201',
    description: 'Optional 6-digit OTP code sent to user email for verification',
  })
  @IsOptional()
  @IsString()
  otpCode?: string;
}
