import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../guards/admin.guard';
import { SuperAdminGuard } from './guards/super-admin.guard';
import { AdminUsersService } from './admin-users.service';
import { ListUsersQueryDto } from './dto/list-users-query.dto';
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

@ApiTags('Admin User Management & Institutional Control')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('admin/users')
export class AdminUsersController {
  constructor(private readonly adminUsersService: AdminUsersService) {}

  /**
   * 1. User KPIs & System Analytics
   */
  @Get('metrics/summary')
  @ApiOperation({
    summary: 'Platform User Analytics & KPI Metrics',
    description:
      'Aggregates real-time KPIs including total users, active vs suspended, role breakdowns, experience tiers, and registration growth (24h/7d/30d).',
  })
  @ApiResponse({
    status: 200,
    description: 'Computed institutional user metrics.',
    type: UserMetricsDto,
  })
  async getMetrics(): Promise<UserMetricsDto> {
    return this.adminUsersService.getMetrics();
  }

  /**
   * 2. Export Users
   */
  @Get('export')
  @ApiOperation({
    summary: 'Export Sanitized User Directory',
    description:
      'Exports all platform users formatted for institutional reporting and compliance with sensitive secrets stripped.',
  })
  @ApiResponse({
    status: 200,
    description: 'Sanitized user list array.',
    type: [UserSummaryDto],
  })
  async exportUsers(): Promise<UserSummaryDto[]> {
    return this.adminUsersService.exportUsers();
  }

  /**
   * 3. Paginated User Directory & Advanced Search
   */
  @Get()
  @ApiOperation({
    summary: 'List Users with Filtering, Pagination & Search',
    description:
      'Search users with fuzzy matching (email, name, phone), filter by role, active status, experience tier, date range, and customizable sorting.',
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated user records with metadata.',
    type: PaginatedUsersResponseDto,
  })
  async listUsers(
    @Query() query: ListUsersQueryDto,
  ): Promise<PaginatedUsersResponseDto> {
    return this.adminUsersService.listUsers(query);
  }

  /**
   * 4. Direct Provision User
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Direct User Provisioning (Create User)',
    description:
      'Directly provisions a new user or partner account with assigned role, hashed password (bcrypt 12 rounds), and initial experience tier.',
  })
  @ApiResponse({
    status: 201,
    description: 'User created successfully.',
    type: UserSummaryDto,
  })
  @ApiResponse({ status: 409, description: 'User with email already exists.' })
  async createUser(
    @Body() dto: CreateUserAdminDto,
    @Request() req: any,
  ): Promise<UserSummaryDto> {
    return this.adminUsersService.createUser(dto, req.user?.email || 'admin');
  }

  /**
   * 5. Bulk Delete Users
   */
  @Post('bulk-delete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Bulk Delete User Accounts (Zero Leak Safe Decommissioning)',
    description:
      'Safely deletes multiple user accounts simultaneously. Root master Super Admin and self-account are automatically skipped for safety.',
  })
  @ApiResponse({ status: 200, description: 'Bulk deletion execution summary.' })
  async bulkDeleteUsers(
    @Body() dto: BulkDeleteUsersDto,
    @Request() req: any,
  ) {
    return this.adminUsersService.bulkDeleteUsers(dto, req.user);
  }

  /**
   * 6. Get User by ID & Session Overview

   */
  @Get(':id')
  @ApiOperation({
    summary: 'Get Detailed User Profile by ID',
    description:
      'Fetches deep user profile, account lifecycle timestamps, and recent active session tokens.',
  })
  @ApiParam({ name: 'id', description: 'User CUID identifier' })
  @ApiResponse({
    status: 200,
    description: 'Comprehensive user profile and sessions.',
    type: UserDetailResponseDto,
  })
  @ApiResponse({ status: 404, description: 'User not found.' })
  async getUserById(@Param('id') id: string): Promise<UserDetailResponseDto> {
    return this.adminUsersService.getUserById(id);
  }

  /**
   * 6. Update User Profile Details
   */
  @Patch(':id')
  @ApiOperation({
    summary: 'Update User Profile Details',
    description: 'Updates legal full name, phone number, and experience level.',
  })
  @ApiParam({ name: 'id', description: 'User CUID identifier' })
  @ApiResponse({
    status: 200,
    description: 'Updated user details.',
    type: UserSummaryDto,
  })
  @ApiResponse({ status: 404, description: 'User not found.' })
  async updateUser(
    @Param('id') id: string,
    @Body() dto: UpdateUserAdminDto,
  ): Promise<UserSummaryDto> {
    return this.adminUsersService.updateUser(id, dto);
  }

  /**
   * 7. Update User Status (Suspend / Reactivate)
   */
  @Patch(':id/status')
  @ApiOperation({
    summary: 'Suspend / Ban or Reactivate User Account',
    description:
      'Toggles active status. When suspending an account, all active refresh sessions are immediately invalidated.',
  })
  @ApiParam({ name: 'id', description: 'User CUID identifier' })
  @ApiResponse({ status: 200, description: 'Account status updated.' })
  @ApiResponse({ status: 403, description: 'Cannot deactivate root super admin.' })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateStatusDto,
    @Request() req: any,
  ) {
    return this.adminUsersService.updateStatus(id, dto, req.user);
  }

  /**
   * 8. Update User Role (SUPER_ADMIN Guarded)
   */
  @Patch(':id/role')
  @UseGuards(SuperAdminGuard)
  @ApiOperation({
    summary: 'Elevate / Demote User Role (Super Admin Only)',
    description:
      'Changes authorization role (e.g. promote to VIP, TRADER, or ADMIN). Strictly requires SUPER_ADMIN authority.',
  })
  @ApiParam({ name: 'id', description: 'User CUID identifier' })
  @ApiResponse({ status: 200, description: 'User role modified successfully.' })
  @ApiResponse({ status: 403, description: 'Forbidden. Requires Super Admin authority.' })
  async updateRole(
    @Param('id') id: string,
    @Body() dto: UpdateRoleDto,
    @Request() req: any,
  ) {
    return this.adminUsersService.updateRole(id, dto, req.user);
  }

  /**
   * 9. Reset User Password (SUPER_ADMIN Guarded)
   */
  @Post(':id/reset-password')
  @HttpCode(HttpStatus.OK)
  @UseGuards(SuperAdminGuard)
  @ApiOperation({
    summary: 'Administrative Password Reset (Super Admin Only)',
    description:
      'Resets password with bcrypt 12-round encryption, generates temporary credentials if requested, and terminates all active sessions.',
  })
  @ApiParam({ name: 'id', description: 'User CUID identifier' })
  @ApiResponse({ status: 200, description: 'Password reset successfully.' })
  @ApiResponse({ status: 403, description: 'Forbidden. Requires Super Admin authority.' })
  async adminResetPassword(
    @Param('id') id: string,
    @Body() dto: AdminResetPasswordDto,
    @Request() req: any,
  ) {
    return this.adminUsersService.adminResetPassword(id, dto, req.user);
  }

  /**
   * 10. List Active User Sessions
   */
  @Get(':id/sessions')
  @ApiOperation({
    summary: 'Inspect Active User Sessions (Security Forensics)',
    description: 'Retrieves all refresh token sessions for the given user.',
  })
  @ApiParam({ name: 'id', description: 'User CUID identifier' })
  @ApiResponse({
    status: 200,
    description: 'List of sessions.',
    type: [UserSessionDto],
  })
  async getUserSessions(@Param('id') id: string): Promise<UserSessionDto[]> {
    return this.adminUsersService.getUserSessions(id);
  }

  /**
   * 11. Global Session Revocation (Force Logout)
   */
  @Post(':id/revoke-sessions')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Revoke All User Sessions (Global Force Logout)',
    description:
      'Invalidates all active refresh tokens for the user, forcing re-authentication across all web and mobile devices.',
  })
  @ApiParam({ name: 'id', description: 'User CUID identifier' })
  @ApiResponse({ status: 200, description: 'Active sessions revoked successfully.' })
  async revokeUserSessions(@Param('id') id: string) {
    return this.adminUsersService.revokeUserSessions(id);
  }


  /**
   * 12. Permanent User Decommissioning (SUPER_ADMIN Guarded)
   */
  @Delete(':id')
  @UseGuards(SuperAdminGuard)
  @ApiOperation({
    summary: 'Permanently Delete User Account (Super Admin Only)',
    description:
      'Safely decommissions and cascades deletion of a user account. Root Super Admin account and self-deletion are strictly protected.',
  })
  @ApiParam({ name: 'id', description: 'User CUID identifier' })
  @ApiResponse({ status: 200, description: 'User account permanently deleted.' })
  @ApiResponse({ status: 403, description: 'Forbidden. Cannot delete root super admin.' })
  async deleteUser(@Param('id') id: string, @Request() req: any) {
    return this.adminUsersService.deleteUser(id, req.user);
  }
}
