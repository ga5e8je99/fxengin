import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  ForbiddenException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiOkResponse,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AdminAuthService } from './admin-auth.service';
import { AdminLoginDto } from './dto/admin-login.dto';
import { AdminRegisterDto } from './dto/admin-register.dto';
import {
  AdminAuthResponseDto,
  SuperAdminProfileResponseDto,
  AdminUserDto,
} from './dto/admin-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from './guards/admin.guard';

@ApiTags('Admin Authentication & Security')
@Controller('admin/auth')
export class AdminAuthController {
  constructor(private readonly adminAuthService: AdminAuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 15, ttl: 60000 } })
  @ApiOperation({
    summary: 'Authenticate Super Administrator',
    description:
      'High-security administrative sign-in. Verifies master credentials, enforces anti-brute force throttling, and issues an isolated 1-hour Admin JWT Access Token and cryptographically hashed Refresh Token.',
  })
  @ApiOkResponse({
    description: 'Administrator authenticated successfully.',
    type: AdminAuthResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Invalid administrator credentials.' })
  @ApiResponse({ status: 403, description: 'Access denied or account deactivated.' })
  @ApiResponse({ status: 429, description: 'Anti-brute force rate limit triggered.' })
  async login(@Body() dto: AdminLoginDto): Promise<AdminAuthResponseDto> {
    return this.adminAuthService.login(dto);
  }

  @Post('register')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({
    summary: 'Register New Administrator Account (Super Admin Clearance Required)',
    description: 'Directly creates a new administrative account. Strictly guarded and restricted to authenticated Super Administrators.',
  })
  @ApiOkResponse({
    description: 'Administrator registered and authenticated successfully.',
    type: AdminAuthResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Missing administrator bearer token.' })
  @ApiResponse({ status: 403, description: 'Access denied. Only Super Administrators can provision new administrators.' })
  @ApiResponse({ status: 409, description: 'Email address already registered.' })
  async register(
    @Request() req: any,
    @Body() dto: AdminRegisterDto,
  ): Promise<AdminAuthResponseDto> {
    if (req.user?.role !== 'SUPER_ADMIN') {
      throw new ForbiddenException('Only the primary Super Administrator can provision new administrator accounts.');
    }
    return this.adminAuthService.register(dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get Active Administrator Identity',
    description: 'Retrieves the authenticated administrator identity based on the verified JWT token.',
  })
  @ApiOkResponse({
    description: 'Active admin user details.',
    type: AdminUserDto,
  })
  @ApiResponse({ status: 401, description: 'Missing or invalid Bearer token.' })
  @ApiResponse({ status: 403, description: 'Forbidden. Requires ADMIN or SUPER_ADMIN role.' })
  async getMe(@Request() req: any): Promise<AdminUserDto> {
    return req.user;
  }

  @Get('super-admin')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get Super Administrator Security Dossier & Permissions',
    description:
      'Returns the full Super Admin identity, security clearance level (Level 5 Root Master), encryption parameters, cryptographic permissions matrix, and system security audit.',
  })
  @ApiOkResponse({
    description: 'Super Admin master dossier and security audit.',
    type: SuperAdminProfileResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Authentication required.' })
  @ApiResponse({ status: 403, description: 'Access restricted to Super Administrators only.' })
  async getSuperAdminProfile(@Request() req: any): Promise<SuperAdminProfileResponseDto> {
    return this.adminAuthService.getSuperAdminProfile(req.user);
  }
}
