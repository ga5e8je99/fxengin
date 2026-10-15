import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UserSummaryDto {
  @ApiProperty({ example: 'cmtprh57w0000pm01ixrtqrfa' })
  id: string;

  @ApiProperty({ example: 'trader@fxengen.com' })
  email: string;

  @ApiProperty({ example: 'Tariq Mansour' })
  fullName: string;

  @ApiPropertyOptional({ example: '+966501234567' })
  phoneNumber: string | null;

  @ApiPropertyOptional({
    example: '+966 50 ••• ••67',
    description: 'Server-side masked phone number (zero client leakage)',
  })
  maskedPhoneNumber?: string | null;

  @ApiPropertyOptional({
    example: 'tr***@fxengen.com',
    description: 'Server-side masked email address',
  })
  maskedEmail?: string;

  @ApiProperty({ example: 'INTERMEDIATE' })
  experienceLevel: string;


  @ApiProperty({ example: 'USER' })
  role: string;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: 2, description: 'Number of active session tokens' })
  activeSessionsCount?: number;

  @ApiProperty({ example: '2026-09-06T12:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-09-06T12:00:00.000Z' })
  updatedAt: Date;
}

export class PaginationMetaDto {
  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 20 })
  limit: number;

  @ApiProperty({ example: 142 })
  totalItems: number;

  @ApiProperty({ example: 8 })
  totalPages: number;

  @ApiProperty({ example: true })
  hasNextPage: boolean;

  @ApiProperty({ example: false })
  hasPreviousPage: boolean;
}

export class PaginatedUsersResponseDto {
  @ApiProperty({ type: [UserSummaryDto] })
  items: UserSummaryDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta: PaginationMetaDto;
}

export class UserSessionDto {
  @ApiProperty({ example: 'sess_12345abcde' })
  id: string;

  @ApiProperty({ example: '2026-09-06T12:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-09-13T12:00:00.000Z' })
  expiresAt: Date;

  @ApiProperty({ example: false })
  isExpired: boolean;

  @ApiProperty({ example: false })
  isRevoked: boolean;

  @ApiPropertyOptional({ example: null })
  revokedAt: Date | null;
}

export class UserDetailResponseDto {
  @ApiProperty({ type: UserSummaryDto })
  user: UserSummaryDto;

  @ApiProperty({ type: [UserSessionDto], description: 'Recent sessions and security activity' })
  sessions: UserSessionDto[];

  @ApiProperty({ example: 3, description: 'Total lifetime sessions created' })
  totalSessionsLifetime: number;
}
