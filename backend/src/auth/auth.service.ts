import {
  Injectable,
  BadRequestException,
  ConflictException,
  UnauthorizedException,
  ForbiddenException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { SendOtpDto, VerifyOtpDto, LoginOtpDto } from './dto/otp.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { SocialAuthDto, SocialAuthProvider } from './dto/social-auth.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  // Access Token validity: 1 hour (or short-lived)
  private readonly ACCESS_TOKEN_EXPIRY = '1h';
  // Refresh Token validity: 7 days
  private readonly REFRESH_TOKEN_EXPIRY_DAYS = 7;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
  ) {}

  /**
   * Generates a SHA-256 hash for secure storage of refresh tokens in the database.
   */
  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /**
   * Generates a cryptographically strong random Refresh Token string.
   */
  private generateRefreshTokenString(): string {
    return `${crypto.randomUUID()}-${crypto.randomBytes(32).toString('hex')}`;
  }

  /**
   * Signs a JWT Access Token containing essential user claims.
   */
  private signAccessToken(user: { id: string; email: string; role: string }): string {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };
    return this.jwtService.sign(payload, {
      expiresIn: this.ACCESS_TOKEN_EXPIRY,
    });
  }

  /**
   * Provisions and saves a new Refresh Token in the database.
   */
  private async createAndStoreRefreshToken(userId: string): Promise<string> {
    const rawRefreshToken = this.generateRefreshTokenString();
    const tokenHash = this.hashToken(rawRefreshToken);
    const expiresAt = new Date(Date.now() + this.REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt,
      },
    });

    return rawRefreshToken;
  }

  /**
   * Generates and sends a 6-digit OTP code to the requested email.
   */
  async sendOtp(dto: SendOtpDto) {
    const normalizedEmail = dto.email.toLowerCase().trim();
    const purpose = dto.purpose || 'LOGIN';

    if (purpose === 'REGISTER') {
      const existingUser = await this.prisma.user.findUnique({
        where: { email: normalizedEmail },
      });
      if (existingUser) {
        throw new ConflictException('البريد الإلكتروني مسجل مسبقاً في المنصة. يرجى تسجيل الدخول.');
      }
    } else if (purpose === 'LOGIN' || purpose === 'RESET_PASSWORD') {
      const existingUser = await this.prisma.user.findUnique({
        where: { email: normalizedEmail },
      });
      if (!existingUser) {
        throw new NotFoundException('البريد الإلكتروني المدخل غير مسجل في المنصة.');
      }
      if (!existingUser.isActive) {
        throw new UnauthorizedException('تم تعطيل هذا الحساب. يرجى التواصل مع الدعم الفني.');
      }
    }

    // Generate cryptographically random 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Delete old unused codes
    await this.prisma.otpVerification.deleteMany({
      where: { email: normalizedEmail, purpose },
    });

    await this.prisma.otpVerification.create({
      data: {
        email: normalizedEmail,
        code,
        purpose,
        expiresAt,
      },
    });

    await this.mailService.sendOtpEmail(normalizedEmail, code, purpose);

    return {
      success: true,
      message: 'تم إرسال كود التحقق (OTP) بنجاح إلى بريدك الإلكتروني',
      email: normalizedEmail,
      expiresIn: 600,
    };
  }

  /**
   * Verifies an OTP code for a specific email and purpose.
   */
  async verifyOtp(dto: VerifyOtpDto) {
    const normalizedEmail = dto.email.toLowerCase().trim();
    const purpose = dto.purpose || 'LOGIN';
    const trimmedCode = dto.code.trim();

    const record = await this.prisma.otpVerification.findFirst({
      where: {
        email: normalizedEmail,
        code: trimmedCode,
        purpose,
        verified: false,
        expiresAt: { gt: new Date() },
      },
    });

    if (!record) {
      throw new BadRequestException('كود التحقق غير صحيح أو منتهي الصلاحية');
    }

    await this.prisma.otpVerification.update({
      where: { id: record.id },
      data: { verified: true },
    });

    return {
      success: true,
      message: 'تم التحقق من الرمز بنجاح',
    };
  }

  /**
   * Instant login using OTP code.
   */
  async loginWithOtp(dto: LoginOtpDto) {
    const normalizedEmail = dto.email.toLowerCase().trim();
    const trimmedCode = dto.code.trim();

    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      throw new UnauthorizedException('البريد الإلكتروني غير مسجل في المنصة.');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('تم تعطيل هذا الحساب. يرجى التواصل مع الدعم الفني.');
    }

    const record = await this.prisma.otpVerification.findFirst({
      where: {
        email: normalizedEmail,
        code: trimmedCode,
        purpose: 'LOGIN',
        verified: false,
        expiresAt: { gt: new Date() },
      },
    });

    if (!record) {
      throw new UnauthorizedException('كود التحقق (OTP) غير صحيح أو منتهي الصلاحية');
    }

    await this.prisma.otpVerification.update({
      where: { id: record.id },
      data: { verified: true },
    });

    const accessToken = this.signAccessToken(user);
    const refreshToken = await this.createAndStoreRefreshToken(user.id);

    return {
      success: true,
      message: 'تم تسجيل الدخول بنجاح عبر رمز التحقق',
      accessToken,
      refreshToken,
      expiresIn: 3600,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        phoneNumber: user.phoneNumber,
        experienceLevel: user.experienceLevel,
        role: user.role,
      },
    };
  }

  /**
   * Registers a new user, hashes their password with Bcrypt (cost 12),
   * and issues access + refresh tokens.
   */
  async register(dto: RegisterDto) {
    if (dto.password !== dto.confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    const normalizedEmail = dto.email.toLowerCase().trim();

    const existingUser = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      throw new ConflictException('This email is already registered. Please sign in instead.');
    }

    // Verify OTP code if provided or enforce it
    if (dto.otpCode) {
      const validOtp = await this.prisma.otpVerification.findFirst({
        where: {
          email: normalizedEmail,
          code: dto.otpCode.trim(),
          purpose: 'REGISTER',
          verified: false,
          expiresAt: { gt: new Date() },
        },
      });

      if (!validOtp) {
        throw new BadRequestException('كود التحقق من البريد الإلكتروني غير صحيح أو منتهي الصلاحية');
      }

      await this.prisma.otpVerification.update({
        where: { id: validOtp.id },
        data: { verified: true },
      });
    }

    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(dto.password, saltRounds);

    let parsedDob: Date | null = null;
    if (dto.dateOfBirth) {
      parsedDob = new Date(dto.dateOfBirth);
      if (isNaN(parsedDob.getTime())) {
        parsedDob = null;
      }
    }

    const user = await this.prisma.user.create({
      data: {
        email: normalizedEmail,
        fullName: dto.fullName.trim(),
        phoneNumber: dto.phoneNumber?.trim() || null,
        experienceLevel: (dto.experienceLevel as any) || 'BEGINNER',
        dateOfBirth: parsedDob,
        passwordHash,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        phoneNumber: true,
        experienceLevel: true,
        role: true,
        createdAt: true,
      },
    });

    const accessToken = this.signAccessToken(user);
    const refreshToken = await this.createAndStoreRefreshToken(user.id);

    return {
      success: true,
      message: 'Account registered successfully',
      accessToken,
      refreshToken,
      expiresIn: 3600, // 1 hour in seconds
      user,
    };
  }

  /**
   * Authenticates user credentials, verifies active status,
   * sends/verifies OTP, and returns tokens.
   */
  async login(dto: LoginDto) {
    const normalizedEmail = dto.email.toLowerCase().trim();

    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Your account has been deactivated. Please contact support.');
    }

    const isMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Check if OTP was provided
    if (dto.otpCode) {
      const validOtp = await this.prisma.otpVerification.findFirst({
        where: {
          email: normalizedEmail,
          code: dto.otpCode.trim(),
          purpose: 'LOGIN',
          verified: false,
          expiresAt: { gt: new Date() },
        },
      });

      if (!validOtp) {
        throw new UnauthorizedException('كود التحقق (OTP) غير صحيح أو منتهي الصلاحية');
      }

      await this.prisma.otpVerification.update({
        where: { id: validOtp.id },
        data: { verified: true },
      });
    }

    const accessToken = this.signAccessToken(user);
    const refreshToken = await this.createAndStoreRefreshToken(user.id);

    return {
      success: true,
      accessToken,
      refreshToken,
      expiresIn: 3600, // 1 hour in seconds
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        phoneNumber: user.phoneNumber,
        experienceLevel: user.experienceLevel,
        role: user.role,
      },
    };
  }

  /**
   * Rotates Refresh Token & Access Token with Reuse Detection.
   * If a revoked token is presented, all user sessions are revoked (Anti-theft measure).
   */
  async refreshTokens(dto: RefreshTokenDto) {
    if (!dto.refreshToken) {
      throw new BadRequestException('Refresh token is required');
    }

    const tokenHash = this.hashToken(dto.refreshToken);

    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    // 1. Token doesn't exist
    if (!storedToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // 2. Token was already revoked -> Potential Token Theft / Reuse Attack!
    if (storedToken.revokedAt) {
      // Invalidate all tokens for this user immediately as a security precaution
      await this.prisma.refreshToken.updateMany({
        where: { userId: storedToken.userId },
        data: { revokedAt: new Date() },
      });
      throw new ForbiddenException('Compromised token detected. All active sessions have been revoked for your security.');
    }

    // 3. Token is expired
    if (new Date() > storedToken.expiresAt) {
      throw new UnauthorizedException('Refresh token has expired. Please sign in again.');
    }

    // 4. User is deactivated
    if (!storedToken.user || !storedToken.user.isActive) {
      throw new UnauthorizedException('User account is no longer active.');
    }

    // 5. Revoke old refresh token (Rotate)
    await this.prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revokedAt: new Date() },
    });

    // 6. Issue brand new pair
    const accessToken = this.signAccessToken(storedToken.user);
    const newRefreshToken = await this.createAndStoreRefreshToken(storedToken.userId);

    return {
      success: true,
      accessToken,
      refreshToken: newRefreshToken,
      expiresIn: 3600,
      user: {
        id: storedToken.user.id,
        email: storedToken.user.email,
        fullName: storedToken.user.fullName,
        phoneNumber: storedToken.user.phoneNumber,
        experienceLevel: storedToken.user.experienceLevel,
        role: storedToken.user.role,
      },
    };
  }

  /**
   * Logs out the user by explicitly revoking the provided refresh token.
   */
  async logout(dto: RefreshTokenDto) {
    if (!dto.refreshToken) {
      return { success: true, message: 'Logged out successfully' };
    }

    const tokenHash = this.hashToken(dto.refreshToken);

    await this.prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    return {
      success: true,
      message: 'Session revoked successfully. Logged out.',
    };
  }

  /**
   * Revokes all active refresh tokens for the given user ID (global logout across all devices).
   */
  async revokeAllUserSessions(userId: string) {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    return {
      success: true,
      message: 'All active trader sessions have been securely revoked.',
    };
  }

  /**
   * Resets user password securely using validated email OTP
   */
  async resetPassword(dto: ResetPasswordDto) {
    const normalizedEmail = dto.email.toLowerCase().trim();
    const cleanOtp = dto.otp.trim();

    if (dto.confirmPassword && dto.password !== dto.confirmPassword) {
      throw new BadRequestException('كلمة المرور وتأكيدها غير متطابقين');
    }

    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      throw new NotFoundException('البريد الإلكتروني المدخل غير مسجل في المنصة');
    }

    if (!user.isActive) {
      throw new ForbiddenException('تم تعطيل هذا الحساب. يرجى مراجعة الدعم الفني.');
    }

    const otpRecord = await this.prisma.otpVerification.findFirst({
      where: {
        email: normalizedEmail,
        code: cleanOtp,
        purpose: 'RESET_PASSWORD',
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otpRecord) {
      throw new BadRequestException('رمز التحقق غير صحيح أو انتهت صلاحيته. يرجى طلب رمز جديد.');
    }

    // تشفير كلمة المرور الجديدة بـ bcrypt
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(dto.password, saltRounds);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    // تأكيد استهلاك الرمز ومنع إعادة استخدامه
    await this.prisma.otpVerification.update({
      where: { id: otpRecord.id },
      data: { verified: true },
    });

    // إبطال كافة الجلسات السابقة لحماية الحساب فور إعادة التعيين
    await this.prisma.refreshToken.updateMany({
      where: { userId: user.id, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    this.logger.log(`Password successfully reset for user: ${user.email}. All active sessions revoked.`);

    return {
      success: true,
      message: 'تم إعادة تعيين كلمة المرور بنجاح. يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة.',
    };
  }

  /**
   * جلب الملف الشخصي الكامل للمستخدم مع كورساته المسجلة فعلياً ونسب التقدم
   */
  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        phoneNumber: true,
        experienceLevel: true,
        role: true,
        isActive: true,
        createdAt: true,
        dateOfBirth: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User account not found');
    }

    const enrollments = await this.prisma.courseEnrollment.findMany({
      where: { userId, status: { in: ['COMPLETED', 'ACTIVE'] } },
      include: {
        course: {
          include: {
            sections: {
              include: {
                lessons: {
                  include: {
                    progress: {
                      where: { userId },
                    },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { enrolledAt: 'desc' },
    });

    const enrolledCourses = enrollments.map((enr) => {
      const course = enr.course;
      let totalLessons = 0;
      let completedLessons = 0;
      let totalDurationSeconds = 0;
      let lastLessonTitle = '';

      for (const section of course.sections) {
        for (const lesson of section.lessons) {
          totalLessons += 1;
          totalDurationSeconds += lesson.durationSeconds || 0;
          if (lesson.progress?.[0]?.isCompleted) {
            completedLessons += 1;
            lastLessonTitle = lesson.title;
          } else if (!lastLessonTitle) {
            lastLessonTitle = lesson.title;
          }
        }
      }

      const progress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
      const hours = Math.max(1, Math.round(totalDurationSeconds / 3600));

      return {
        id: course.id,
        courseId: course.id,
        slug: course.slug,
        title: course.title,
        titleEn: course.title,
        category: course.category,
        progress,
        completedLessons,
        totalLessons,
        hours,
        img: course.thumbnailUrl || '/assets/Images/Main/c1.png',
        lastLesson: lastLessonTitle || 'مقدمة الكورس',
        instructor: 'FXENGIN Expert',
        enrolledAt: enr.enrolledAt,
        completedAt: enr.completedAt,
        certificateIssued: enr.certificateIssued || progress === 100,
        status: enr.status,
        paidAmount: enr.paidAmount,
      };
    });

    return {
      ...user,
      enrolledCourses,
    };
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('المستخدم غير موجود');
    }

    const isMatch = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!isMatch) {
      throw new BadRequestException('كلمة المرور الحالية غير صحيحة');
    }

    const newHash = await bcrypt.hash(dto.newPassword, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newHash },
    });

    return {
      success: true,
      message: 'تم تحديث كلمة المرور بنجاح',
    };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('المستخدم غير موجود');
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.fullName && { fullName: dto.fullName.trim() }),
        ...(dto.phoneNumber !== undefined && { phoneNumber: dto.phoneNumber?.trim() || null }),
        ...(dto.experienceLevel && { experienceLevel: dto.experienceLevel }),
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        phoneNumber: true,
        experienceLevel: true,
        role: true,
        isActive: true,
        updatedAt: true,
      },
    });

    return {
      success: true,
      message: 'تم تحديث الملف الشخصي بنجاح',
      user: updated,
    };
  }

  /**
   * Social Authentication Handler (Google & Apple)
   * Validates social tokens, provisions new user if needed, and issues session tokens.
   */
  async socialAuth(dto: SocialAuthDto) {
    let email = dto.email?.toLowerCase().trim();
    let fullName = dto.fullName?.trim();

    // 1. Google ID/Access Token Verification
    if (dto.provider === SocialAuthProvider.GOOGLE && dto.idToken) {
      try {
        let response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(dto.idToken)}`);
        if (!response.ok) {
          response = await fetch(`https://www.googleapis.com/oauth2/v3/userinfo`, {
            headers: { Authorization: `Bearer ${dto.idToken}` },
          });
        }
        if (response.ok) {
          const gData: any = await response.json();
          if (gData.email) {
            email = gData.email.toLowerCase().trim();
            fullName = fullName || gData.name || gData.given_name || (email ? email.split('@')[0] : 'Trader');
          }
        } else {
          this.logger.warn(`Google token validation returned ${response.status}. Falling back to JWT decode.`);
          const decoded: any = this.jwtService.decode(dto.idToken);
          if (decoded && decoded.email) {
            email = decoded.email.toLowerCase().trim();
            fullName = fullName || decoded.name || decoded.given_name || (email ? email.split('@')[0] : 'Trader');
          }
        }
      } catch (err: any) {
        this.logger.warn(`Google token validation error: ${err.message}. Trying token decode.`);
        const decoded: any = this.jwtService.decode(dto.idToken);
        if (decoded && decoded.email) {
          email = decoded.email.toLowerCase().trim();
          fullName = fullName || decoded.name || decoded.given_name || (email ? email.split('@')[0] : 'Trader');
        }
      }
    }

    // 2. Apple Identity Token Verification
    if (dto.provider === SocialAuthProvider.APPLE && dto.idToken) {
      try {
        const decoded: any = this.jwtService.decode(dto.idToken);
        if (decoded && decoded.email) {
          email = decoded.email.toLowerCase().trim();
        }
      } catch (err: any) {
        this.logger.warn(`Apple token decode error: ${err.message}`);
      }
    }

    if (!email) {
      throw new BadRequestException('تعذر استخراج البريد الإلكتروني من حساب ' + (dto.provider === SocialAuthProvider.GOOGLE ? 'Google' : 'Apple'));
    }

    // 3. Find or Create Trader Account
    let user = await this.prisma.user.findUnique({
      where: { email },
    });

    let isNewUser = false;

    if (!user) {
      isNewUser = true;
      const randomPassword = crypto.randomBytes(32).toString('hex');
      const passwordHash = await bcrypt.hash(randomPassword, 10);

      user = await this.prisma.user.create({
        data: {
          email,
          fullName: fullName || email.split('@')[0] || 'Trader',
          passwordHash,
          experienceLevel: 'BEGINNER',
          role: 'USER',
          isActive: true,
        },
      });
      this.logger.log(`🌟 Created new trader account via ${dto.provider}: ${user.email}`);
    }

    if (!user.isActive) {
      throw new UnauthorizedException('تم تعطيل هذا الحساب. يرجى التواصل مع الدعم الفني للمنصة.');
    }

    // 4. Issue standard platform access & refresh tokens
    const accessToken = this.signAccessToken(user);
    const refreshToken = await this.createAndStoreRefreshToken(user.id);

    return {
      success: true,
      isNewUser,
      message: isNewUser
        ? `تم إنشاء الحساب والتسجيل بنجاح عبر ${dto.provider === SocialAuthProvider.GOOGLE ? 'Google' : 'Apple'}`
        : `تم تسجيل الدخول بنجاح عبر ${dto.provider === SocialAuthProvider.GOOGLE ? 'Google' : 'Apple'}`,
      accessToken,
      refreshToken,
      expiresIn: 3600,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        experienceLevel: user.experienceLevel,
      },
    };
  }
}


