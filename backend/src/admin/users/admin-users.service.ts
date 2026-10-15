import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { EncryptionService } from '../../common/services/encryption.service';
import {
  ListUsersQueryDto,
  AdminUserSortBy,
  SortOrder,
} from './dto/list-users-query.dto';
import { CreateUserAdminDto } from './dto/create-user-admin.dto';
import { UpdateUserAdminDto } from './dto/update-user-admin.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { AdminResetPasswordDto } from './dto/admin-reset-password.dto';
import { BulkDeleteUsersDto } from './dto/bulk-user-action.dto';
import { UserMetricsDto } from './dto/user-metrics.dto';
import {
  PaginatedUsersResponseDto,
  UserDetailResponseDto,
  UserSessionDto,
  UserSummaryDto,
} from './dto/user-detail-response.dto';

@Injectable()
export class AdminUsersService {
  private readonly logger = new Logger(AdminUsersService.name);
  private readonly PRIMARY_SUPER_ADMIN_EMAIL =
    process.env.SUPER_ADMIN_EMAIL || 'admin@fxengen.com';

  constructor(
    private readonly prisma: PrismaService,
    private readonly encryption: EncryptionService,
  ) {}


  /**
   * 1. List users with institutional-grade filtering, search, sorting & pagination.
   */
  async listUsers(query: ListUsersQueryDto): Promise<PaginatedUsersResponseDto> {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    // Fuzzy search across email, fullName, phoneNumber
    if (query.search && query.search.trim()) {
      const term = query.search.trim();
      where.OR = [
        { email: { contains: term, mode: 'insensitive' } },
        { fullName: { contains: term, mode: 'insensitive' } },
        { phoneNumber: { contains: term, mode: 'insensitive' } },
      ];
    }

    if (query.role) {
      where.role = query.role;
    }

    if (query.isActive !== undefined) {
      where.isActive = query.isActive;
    }

    if (query.experienceLevel) {
      where.experienceLevel = query.experienceLevel;
    }

    if (query.fromDate || query.toDate) {
      where.createdAt = {};
      if (query.fromDate) {
        where.createdAt.gte = new Date(query.fromDate);
      }
      if (query.toDate) {
        where.createdAt.lte = new Date(query.toDate);
      }
    }

    const [totalItems, users] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          [query.sortBy || AdminUserSortBy.CREATED_AT]:
            query.sortOrder || SortOrder.DESC,
        },
        select: {
          id: true,
          email: true,
          fullName: true,
          phoneNumber: true,
          experienceLevel: true,
          role: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              refreshTokens: {
                where: {
                  revokedAt: null,
                  expiresAt: { gt: new Date() },
                },
              },
            },
          },
        },
      }),
    ]);

    const totalPages = Math.ceil(totalItems / limit) || 1;

    const items: UserSummaryDto[] = users.map((u: any) => {
      const rawPhone = u.phoneNumber ? this.encryption.decrypt(u.phoneNumber) : null;
      return {
        id: u.id,
        email: u.email,
        fullName: u.fullName,
        phoneNumber: rawPhone,
        maskedPhoneNumber: this.encryption.maskPhone(rawPhone),
        maskedEmail: this.encryption.maskEmail(u.email),
        experienceLevel: u.experienceLevel,
        role: u.role,
        isActive: u.isActive,
        activeSessionsCount: u._count?.refreshTokens ?? 0,
        createdAt: u.createdAt,
        updatedAt: u.updatedAt,
      };
    });



    return {
      items,
      meta: {
        page,
        limit,
        totalItems,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  /**
   * 2. Comprehensive platform user metrics & KPIs.
   */
  async getMetrics(): Promise<UserMetricsDto> {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      activeUsers,
      suspendedUsers,
      roleCounts,
      experienceCounts,
      growth24h,
      growth7d,
      growth30d,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { isActive: true } }),
      this.prisma.user.count({ where: { isActive: false } }),
      this.prisma.user.groupBy({
        by: ['role'],
        _count: { _all: true },
      }),
      this.prisma.user.groupBy({
        by: ['experienceLevel'],
        _count: { _all: true },
      }),
      this.prisma.user.count({ where: { createdAt: { gte: oneDayAgo } } }),
      this.prisma.user.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
      this.prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    ]);

    const rolesMap: any = {
      USER: 0,
      TRADER: 0,
      VIP: 0,
      ADMIN: 0,
      SUPER_ADMIN: 0,
    };
    roleCounts.forEach((rc: any) => {
      rolesMap[rc.role] = rc._count._all;
    });

    const expMap: any = {
      BEGINNER: 0,
      INTERMEDIATE: 0,
      ADVANCED: 0,
    };
    experienceCounts.forEach((ec: any) => {
      expMap[ec.experienceLevel] = ec._count._all;
    });


    return {
      totalUsers,
      activeUsers,
      suspendedUsers,
      roles: rolesMap,
      experienceLevels: expMap,
      growth: {
        last24Hours: growth24h,
        last7Days: growth7d,
        last30Days: growth30d,
      },
      computedAt: now.toISOString(),
    };
  }

  /**
   * 3. Sanitized export of platform users for compliance and reporting.
   */
  async exportUsers(): Promise<UserSummaryDto[]> {
    const users = await this.prisma.user.findMany({
      take: 5000,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        fullName: true,
        phoneNumber: true,
        experienceLevel: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return users.map((u: any) => {
      const rawPhone = u.phoneNumber ? this.encryption.decrypt(u.phoneNumber) : null;
      return {
        id: u.id,
        email: u.email,
        fullName: u.fullName,
        phoneNumber: rawPhone,
        maskedPhoneNumber: this.encryption.maskPhone(rawPhone),
        maskedEmail: this.encryption.maskEmail(u.email),
        experienceLevel: u.experienceLevel,
        role: u.role,
        isActive: u.isActive,
        createdAt: u.createdAt,
        updatedAt: u.updatedAt,
      };
    });
  }

  /**
   * 4. Full profile and session drill-down by ID.
   */
  async getUserById(id: string): Promise<UserDetailResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        fullName: true,
        phoneNumber: true,
        experienceLevel: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID '${id}' was not found.`);
    }

    const [sessions, totalSessionsLifetime] = await Promise.all([
      this.prisma.refreshToken.findMany({
        where: { userId: id },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
      this.prisma.refreshToken.count({ where: { userId: id } }),
    ]);

    const now = new Date();
    const formattedSessions: UserSessionDto[] = sessions.map((s: any) => ({
      id: s.id,
      createdAt: s.createdAt,
      expiresAt: s.expiresAt,
      isExpired: s.expiresAt < now,
      isRevoked: s.revokedAt !== null,
      revokedAt: s.revokedAt,
    }));

    const rawPhone = user.phoneNumber ? this.encryption.decrypt(user.phoneNumber) : null;

    return {
      user: {
        ...user,
        phoneNumber: rawPhone,
        maskedPhoneNumber: this.encryption.maskPhone(rawPhone),
        maskedEmail: this.encryption.maskEmail(user.email),
        activeSessionsCount: formattedSessions.filter(
          (s) => !s.isExpired && !s.isRevoked,
        ).length,
      },
      sessions: formattedSessions,
      totalSessionsLifetime,
    };
  }


  /**
   * 5. Direct user provisioning by administrator.
   */
  async createUser(dto: CreateUserAdminDto, adminEmail: string): Promise<UserSummaryDto> {
    const email = dto.email.toLowerCase().trim();

    const existing = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      throw new ConflictException(`User with email '${email}' is already registered.`);
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const encryptedPhone = dto.phoneNumber?.trim()
      ? this.encryption.encrypt(dto.phoneNumber.trim())
      : null;

    const user = await this.prisma.user.create({
      data: {
        email,
        fullName: dto.fullName.trim(),
        passwordHash,
        phoneNumber: encryptedPhone,
        role: (dto.role as any) || 'USER',
        experienceLevel: (dto.experienceLevel as any) || 'BEGINNER',
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        phoneNumber: true,
        experienceLevel: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    this.logger.log(
      `👤 Administrator '${adminEmail}' created new user '${email}' (Role: ${user.role}).`,
    );

    const rawPhone = user.phoneNumber ? this.encryption.decrypt(user.phoneNumber) : null;
    return {
      ...user,
      phoneNumber: rawPhone,
      maskedPhoneNumber: this.encryption.maskPhone(rawPhone),
      maskedEmail: this.encryption.maskEmail(user.email),
    };
  }

  /**
   * 6. Update user profile information.
   */
  async updateUser(id: string, dto: UpdateUserAdminDto): Promise<UserSummaryDto> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID '${id}' was not found.`);
    }

    const data: any = {};
    if (dto.fullName !== undefined) data.fullName = dto.fullName.trim();
    if (dto.phoneNumber !== undefined) {
      data.phoneNumber = dto.phoneNumber?.trim()
        ? this.encryption.encrypt(dto.phoneNumber.trim())
        : null;
    }
    if (dto.experienceLevel !== undefined) data.experienceLevel = dto.experienceLevel as any;

    const updated = await this.prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        fullName: true,
        phoneNumber: true,
        experienceLevel: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const rawPhone = updated.phoneNumber ? this.encryption.decrypt(updated.phoneNumber) : null;
    return {
      ...updated,
      phoneNumber: rawPhone,
      maskedPhoneNumber: this.encryption.maskPhone(rawPhone),
      maskedEmail: this.encryption.maskEmail(updated.email),
    };
  }


  /**
   * 7. Toggle account active status (suspend / ban / activate) with automatic session termination.
   */
  async updateStatus(id: string, dto: UpdateStatusDto, actorUser: any) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID '${id}' was not found.`);
    }

    // Protection rule: Primary Super Admin account cannot be deactivated
    if (
      user.email === this.PRIMARY_SUPER_ADMIN_EMAIL ||
      user.role === ('SUPER_ADMIN' as any)
    ) {
      throw new ForbiddenException(
        'The primary Super Administrator account cannot be suspended or deactivated.',
      );
    }

    // Protection rule: Cannot suspend self
    if (user.id === actorUser.id && !dto.isActive) {
      throw new BadRequestException('Administrators cannot suspend their own active account.');
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: { isActive: dto.isActive },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        isActive: true,
        updatedAt: true,
      },
    });

    // If deactivated, revoke all active sessions immediately
    if (!dto.isActive) {
      await this.revokeUserSessions(id);
      this.logger.warn(
        `⛔ User '${user.email}' was SUSPENDED by admin '${actorUser.email}'. Reason: ${
          dto.reason || 'None provided'
        }. All sessions terminated.`,
      );
    } else {
      this.logger.log(
        `✅ User '${user.email}' was REACTIVATED by admin '${actorUser.email}'.`,
      );
    }

    return {
      user: updated,
      message: dto.isActive
        ? 'User account has been activated successfully.'
        : 'User account has been suspended and all active sessions terminated.',
      auditReason: dto.reason || null,
    };
  }

  /**
   * 8. Update user role (Elevate/Demote) — Strictly protected by SuperAdmin.
   */
  async updateRole(id: string, dto: UpdateRoleDto, actorUser: any) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID '${id}' was not found.`);
    }

    // Protection: Primary Super Admin role cannot be altered
    if (user.email === this.PRIMARY_SUPER_ADMIN_EMAIL) {
      throw new ForbiddenException(
        'The primary Super Administrator master role cannot be altered.',
      );
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: { role: dto.role as any },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        isActive: true,
        updatedAt: true,
      },
    });

    this.logger.log(
      `🎖️ User '${user.email}' role updated to '${dto.role}' by Super Admin '${actorUser.email}'.`,
    );

    return updated;
  }

  /**
   * 9. Administrative password reset with Bcrypt 12 rounds and session revocation.
   */
  async adminResetPassword(
    id: string,
    dto: AdminResetPasswordDto,
    actorUser: any,
  ) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID '${id}' was not found.`);
    }

    // Protection: Primary Super Admin password cannot be reset by another user
    if (
      user.email === this.PRIMARY_SUPER_ADMIN_EMAIL &&
      actorUser.email !== this.PRIMARY_SUPER_ADMIN_EMAIL
    ) {
      throw new ForbiddenException(
        'Only the primary Super Administrator can reset the root account password.',
      );
    }

    let passwordToSet = dto.newPassword;
    let isAutoGenerated = false;

    if (!passwordToSet || dto.generateRandom) {
      passwordToSet = `FX#${crypto.randomBytes(6).toString('hex')}!${crypto.randomInt(1000, 9999)}`;
      isAutoGenerated = true;
    }

    const passwordHash = await bcrypt.hash(passwordToSet, 12);

    await this.prisma.user.update({
      where: { id },
      data: { passwordHash },
    });

    // Invalidate all active sessions to ensure the user logs in fresh
    await this.revokeUserSessions(id);

    this.logger.log(
      `🔑 Password for user '${user.email}' was reset by admin '${actorUser.email}'. All active sessions revoked.`,
    );

    return {
      success: true,
      message: 'Password reset successfully. All active sessions have been revoked.',
      userEmail: user.email,
      ...(isAutoGenerated ? { temporaryPassword: passwordToSet } : {}),
    };
  }

  /**
   * 10. Forensics: Inspect active and expired sessions for user.
   */
  async getUserSessions(id: string): Promise<UserSessionDto[]> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID '${id}' was not found.`);
    }

    const sessions = await this.prisma.refreshToken.findMany({
      where: { userId: id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const now = new Date();
    return sessions.map((s: any) => ({
      id: s.id,
      createdAt: s.createdAt,
      expiresAt: s.expiresAt,
      isExpired: s.expiresAt < now,
      isRevoked: s.revokedAt !== null,
      revokedAt: s.revokedAt,
    }));

  }

  /**
   * 11. Force global logout: Revoke all active refresh sessions for user.
   */
  async revokeUserSessions(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID '${id}' was not found.`);
    }

    const updateResult = await this.prisma.refreshToken.updateMany({
      where: {
        userId: id,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });

    this.logger.log(
      `🚪 Invalidated ${updateResult.count} active sessions for user '${user.email}'.`,
    );

    return {
      success: true,
      revokedCount: updateResult.count,
      message: `Successfully invalidated ${updateResult.count} active sessions. User is logged out across all devices.`,
    };
  }

  /**
   * 12. Safe decommissioning / permanent deletion of user account.
   */
  async deleteUser(id: string, actorUser: any) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID '${id}' was not found.`);
    }

    // Protection rule: Root Super Admin account cannot be deleted
    if (
      user.email === this.PRIMARY_SUPER_ADMIN_EMAIL ||
      user.role === ('SUPER_ADMIN' as any)
    ) {
      throw new ForbiddenException(
        'The primary Super Administrator account is root protected and cannot be deleted.',
      );
    }

    // Protection rule: Cannot delete self
    if (user.id === actorUser.id) {
      throw new BadRequestException('Administrators cannot delete their own account.');
    }

    // Cascade delete user and associated records
    await this.prisma.user.delete({
      where: { id },
    });

    this.logger.warn(
      `🗑️ User '${user.email}' (ID: ${id}) permanently DELETED by Super Admin '${actorUser.email}'.`,
    );

    return {
      success: true,
      message: `User account '${user.email}' has been permanently deleted.`,
    };
  }

  /**
   * 13. Bulk safe deletion of multiple user accounts.
   */
  async bulkDeleteUsers(dto: BulkDeleteUsersDto, actorUser: any) {
    const toDelete = dto.userIds.filter((id) => id !== actorUser.id);
    const users = await this.prisma.user.findMany({
      where: { id: { in: toDelete } },
      select: { id: true, email: true, role: true },
    });

    const safeIds = users
      .filter(
        (u: any) =>
          u.email !== this.PRIMARY_SUPER_ADMIN_EMAIL &&
          u.role !== ('SUPER_ADMIN' as any),
      )
      .map((u: any) => u.id);

    if (safeIds.length === 0) {
      return { success: false, message: 'No eligible user accounts found to delete.' };
    }

    const deleteRes = await this.prisma.user.deleteMany({
      where: { id: { in: safeIds } },
    });

    this.logger.warn(
      `🗑️ Bulk delete executed by '${actorUser.email}': Removed ${deleteRes.count} user accounts.`,
    );

    return {
      success: true,
      deletedCount: deleteRes.count,
      message: `Successfully deleted ${deleteRes.count} user account(s).`,
    };
  }
}

