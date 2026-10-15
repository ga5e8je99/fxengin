import { ApiProperty } from '@nestjs/swagger';

export class RoleDistributionDto {
  @ApiProperty({ example: 450 })
  USER: number;

  @ApiProperty({ example: 85 })
  TRADER: number;

  @ApiProperty({ example: 40 })
  VIP: number;

  @ApiProperty({ example: 3 })
  ADMIN: number;

  @ApiProperty({ example: 1 })
  SUPER_ADMIN: number;
}

export class ExperienceDistributionDto {
  @ApiProperty({ example: 310 })
  BEGINNER: number;

  @ApiProperty({ example: 190 })
  INTERMEDIATE: number;

  @ApiProperty({ example: 79 })
  ADVANCED: number;
}

export class GrowthMetricsDto {
  @ApiProperty({ example: 12, description: 'New users registered in the last 24 hours' })
  last24Hours: number;

  @ApiProperty({ example: 68, description: 'New users registered in the last 7 days' })
  last7Days: number;

  @ApiProperty({ example: 215, description: 'New users registered in the last 30 days' })
  last30Days: number;
}

export class UserMetricsDto {
  @ApiProperty({ example: 579, description: 'Total registered user count across all roles' })
  totalUsers: number;

  @ApiProperty({ example: 565, description: 'Active eligible accounts' })
  activeUsers: number;

  @ApiProperty({ example: 14, description: 'Deactivated / suspended accounts' })
  suspendedUsers: number;

  @ApiProperty({ type: RoleDistributionDto, description: 'Distribution of users across authorization roles' })
  roles: RoleDistributionDto;

  @ApiProperty({ type: ExperienceDistributionDto, description: 'Distribution of users across market experience levels' })
  experienceLevels: ExperienceDistributionDto;

  @ApiProperty({ type: GrowthMetricsDto, description: 'User registration growth indicators' })
  growth: GrowthMetricsDto;

  @ApiProperty({ example: '2026-09-06T12:00:00.000Z', description: 'Timestamp when metrics were computed' })
  computedAt: string;
}
