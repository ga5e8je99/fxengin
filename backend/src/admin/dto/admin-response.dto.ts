import { ApiProperty } from '@nestjs/swagger';

export class AdminUserDto {
  @ApiProperty({ example: 'cuid123456789', description: 'Unique admin user ID' })
  id: string;

  @ApiProperty({ example: 'admin@fxengen.com', description: 'Super Administrator email' })
  email: string;

  @ApiProperty({ example: 'Master Super Admin', description: 'Administrator full name' })
  fullName: string;

  @ApiProperty({ example: 'SUPER_ADMIN', description: 'Role assignment (SUPER_ADMIN / ADMIN)' })
  role: string;

  @ApiProperty({ example: true, description: 'Account active status' })
  isActive: boolean;

  @ApiProperty({ example: '2026-09-06T12:00:00.000Z', description: 'Account creation timestamp' })
  createdAt: Date | string;
}

export class AdminAuthResponseDto {
  @ApiProperty({ type: AdminUserDto, description: 'Super admin profile information' })
  admin: AdminUserDto;

  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'Signed JWT Bearer Access Token with administrative clearance (1 hour validity)',
  })
  accessToken: string;

  @ApiProperty({
    example: 'd9b3a5f4c8e7...',
    description: 'Cryptographically hashed Refresh Token for administrative session renewal',
  })
  refreshToken: string;

  @ApiProperty({ example: 3600, description: 'Access token time-to-live in seconds' })
  expiresIn: number;
}

export class SuperAdminProfileResponseDto {
  @ApiProperty({ type: AdminUserDto, description: 'Master administrator identity' })
  profile: AdminUserDto;

  @ApiProperty({ example: 'LEVEL_5_ROOT_MASTER', description: 'Security clearance level' })
  securityClearance: string;

  @ApiProperty({
    example: [
      'ALL_PRIVILEGES',
      'MANAGE_SYSTEM_SETTINGS',
      'MANAGE_ADMIN_USERS',
      'MANAGE_TRADERS',
      'MANAGE_FINANCIAL_GATEWAYS',
      'MANAGE_BOT_LICENSES',
      'SYSTEM_SECURITY_AUDIT',
    ],
    description: 'Cryptographic permissions matrix',
  })
  permissions: string[];

  @ApiProperty({
    example: {
      encryptionAlgorithm: 'BCRYPT_SALT_12_ROUNDS',
      jwtAlgorithm: 'HS256_HIGH_ENTROPY',
      rateLimitingStatus: 'STRICT_ANTI_BRUTE_FORCE_ACTIVE',
      sessionSecurity: 'ISOLATED_SECURE_TOKEN_ROTATION',
    },
    description: 'Security and encryption audit state',
  })
  securityAudit: Record<string, string>;

  @ApiProperty({ example: '2026-09-06T14:50:00.000Z', description: 'Telemetry check timestamp' })
  timestamp: string;
}
