import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { PrismaModule } from '../prisma/prisma.module';
import { EncryptionService } from '../common/services/encryption.service';
import { AdminAuthController } from './admin-auth.controller';
import { AdminAuthService } from './admin-auth.service';
import { AdminGuard } from './guards/admin.guard';
import { AdminUsersController } from './users/admin-users.controller';
import { AdminUsersService } from './users/admin-users.service';
import { SuperAdminGuard } from './users/guards/super-admin.guard';
import { AdminCoursesController } from './courses/admin-courses.controller';
import { AdminCoursesService } from './courses/admin-courses.service';
import { StorageController } from './storage/storage.controller';
import { StorageService } from './storage/storage.service';

@Module({
  imports: [
    PrismaModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'fxengin_super_jwt_secret_key_2026_production_grade_998877!@#',
      signOptions: { expiresIn: '1h' },
    }),
  ],
  controllers: [
    AdminAuthController,
    AdminUsersController,
    AdminCoursesController,
    StorageController,
  ],
  providers: [
    AdminAuthService,
    AdminGuard,
    AdminUsersService,
    SuperAdminGuard,
    EncryptionService,
    AdminCoursesService,
    StorageService,
  ],
  exports: [
    AdminAuthService,
    AdminGuard,
    AdminUsersService,
    SuperAdminGuard,
    EncryptionService,
    AdminCoursesService,
    StorageService,
  ],
})
export class AdminModule {}
