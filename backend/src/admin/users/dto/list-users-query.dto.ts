import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type, Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export enum AdminUserSortBy {
  CREATED_AT = 'createdAt',
  EMAIL = 'email',
  FULL_NAME = 'fullName',
  ROLE = 'role',
}

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export enum UserRoleFilter {
  USER = 'USER',
  TRADER = 'TRADER',
  VIP = 'VIP',
  ADMIN = 'ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN',
}

export enum ExperienceLevelFilter {
  BEGINNER = 'BEGINNER',
  INTERMEDIATE = 'INTERMEDIATE',
  ADVANCED = 'ADVANCED',
}

export class ListUsersQueryDto {
  @ApiPropertyOptional({
    example: 1,
    description: 'Page index number (starts at 1)',
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({
    example: 20,
    description: 'Number of records per page (max 100)',
    default: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 20;

  @ApiPropertyOptional({
    example: 'ahmed',
    description: 'Fuzzy search term matching email, fullName, or phoneNumber',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    enum: UserRoleFilter,
    description: 'Filter users by assigned role',
  })
  @IsOptional()
  @IsEnum(UserRoleFilter)
  role?: UserRoleFilter;

  @ApiPropertyOptional({
    example: true,
    description: 'Filter users by account active status',
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return undefined;
  })
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    enum: ExperienceLevelFilter,
    description: 'Filter users by trading experience level',
  })
  @IsOptional()
  @IsEnum(ExperienceLevelFilter)
  experienceLevel?: ExperienceLevelFilter;

  @ApiPropertyOptional({
    enum: AdminUserSortBy,
    default: AdminUserSortBy.CREATED_AT,
    description: 'Field to sort records by',
  })
  @IsOptional()
  @IsEnum(AdminUserSortBy)
  sortBy: AdminUserSortBy = AdminUserSortBy.CREATED_AT;

  @ApiPropertyOptional({
    enum: SortOrder,
    default: SortOrder.DESC,
    description: 'Sort direction order',
  })
  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder: SortOrder = SortOrder.DESC;

  @ApiPropertyOptional({
    example: '2026-01-01',
    description: 'Filter records created on or after date (ISO format)',
  })
  @IsOptional()
  @IsString()
  fromDate?: string;

  @ApiPropertyOptional({
    example: '2026-12-31',
    description: 'Filter records created on or before date (ISO format)',
  })
  @IsOptional()
  @IsString()
  toDate?: string;
}
