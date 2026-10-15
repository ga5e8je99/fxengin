import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ExperienceLevelFilter } from './list-users-query.dto';

export class UpdateUserAdminDto {
  @ApiPropertyOptional({
    example: 'Tariq Mansour Al-Ghamdi',
    description: 'Updated full name',
  })
  @IsOptional()
  @IsString()
  fullName?: string;

  @ApiPropertyOptional({
    example: '+966559876543',
    description: 'Updated contact phone number',
  })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiPropertyOptional({
    enum: ExperienceLevelFilter,
    description: 'Updated trading experience level',
  })
  @IsOptional()
  @IsEnum(ExperienceLevelFilter)
  experienceLevel?: ExperienceLevelFilter;
}
