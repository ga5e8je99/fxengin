import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { UserRoleFilter, ExperienceLevelFilter } from './list-users-query.dto';

export class CreateUserAdminDto {
  @ApiProperty({
    example: 'trader.vip@fxengen.com',
    description: 'User registered email address',
  })
  @IsEmail({}, { message: 'Invalid email address format' })
  @IsNotEmpty({ message: 'Email address is required' })
  email: string;

  @ApiProperty({
    example: 'Tariq Al-Mansour',
    description: 'Full official legal name of the user',
  })
  @IsString()
  @IsNotEmpty({ message: 'Full name is required' })
  fullName: string;

  @ApiProperty({
    example: 'TraderSecure#2026!Pass',
    description: 'Initial login password (must be at least 8 characters)',
    minLength: 8,
  })
  @IsString()
  @IsNotEmpty({ message: 'Initial password is required' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  password: string;

  @ApiPropertyOptional({
    example: '+966501234567',
    description: 'International phone number with country dial code',
  })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiPropertyOptional({
    enum: UserRoleFilter,
    default: UserRoleFilter.USER,
    description: 'User access role',
  })
  @IsOptional()
  @IsEnum(UserRoleFilter)
  role?: UserRoleFilter;

  @ApiPropertyOptional({
    enum: ExperienceLevelFilter,
    default: ExperienceLevelFilter.BEGINNER,
    description: 'Trading market experience tier',
  })
  @IsOptional()
  @IsEnum(ExperienceLevelFilter)
  experienceLevel?: ExperienceLevelFilter;
}
