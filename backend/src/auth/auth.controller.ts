import {
  Controller,
  Post,
  Body,
  Get,
  Patch,
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
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { SendOtpDto, VerifyOtpDto, LoginOtpDto } from './dto/otp.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { SocialAuthDto } from './dto/social-auth.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('send-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'إرسال كود التحقق OTP إلى البريد الإلكتروني (Send Email OTP)',
    description: 'يولد كود تحقق مكون من 6 أرقام ويرسله عبر بريد fxengin519@gmail.com للمستخدم.',
  })
  async sendOtp(@Body() dto: SendOtpDto) {
    return this.authService.sendOtp(dto);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'طلب كود استعادة كلمة المرور (Forgot Password Request)',
    description: 'يرسل كود تحقق OTP لاستعادة كلمة المرور إلى البريد الإلكتروني للمستخدم.',
  })
  async forgotPassword(@Body() dto: SendOtpDto) {
    return this.authService.sendOtp({ email: dto.email, purpose: 'RESET_PASSWORD' });
  }

  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'التحقق من صحة كود OTP (Verify Email OTP)',
    description: 'يفحص صحة وصلاحية كود التحقق المرسل للمستخدم.',
  })
  async verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyOtp(dto);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'إعادة تعيين كلمة المرور باستخدام رمز OTP (Secure Password Reset)',
    description: 'يتحقق من رمز OTP المرسل للبريد ويقوم بتشفير كلمة المرور الجديدة وتحديثها في قاعدة البيانات.',
  })
  @ApiResponse({ status: 200, description: 'تم تحديث كلمة المرور بنجاح.' })
  @ApiResponse({ status: 400, description: 'رمز التحقق غير صحيح أو منتهي الصلاحية.' })
  @ApiResponse({ status: 404, description: 'البريد الإلكتروني غير مسجل.' })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @Post('login-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'تسجيل الدخول المباشر بكود OTP (Direct Login via OTP)',
    description: 'يتيح تسجيل الدخول المباشر بالبريد ورمز التحقق الصالح الصادر من fxengin519@gmail.com.',
  })
  async loginWithOtp(@Body() dto: LoginOtpDto) {
    return this.authService.loginWithOtp(dto);
  }

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: '1. تسجيل حساب متداول جديد (Register Trader Account)',
    description:
      '📌 **لازمتها إيه في الفرونت إند:**\n' +
      '- تُربط بفورم إنشاء الحساب الجديد في صفحة التسجيل (/register).\n' +
      '- تُرسل بيانات المستخدم: `{ email, password, fullName, phone, experienceLevel }`.\n' +
      '- عند النجاح: تُرجع `accessToken` و `refreshToken` وبيانات المستخدم ليتم تخزينها والدخول تلقائياً.\n' +
      '- لا تتطلب توكن (Public).',
  })
  @ApiResponse({
    status: 201,
    description: 'تم تسجيل الحساب بنجاح وإصدار التوكنات.',
  })
  @ApiResponse({
    status: 400,
    description: 'فشل التحقق من صحة البيانات أو عدم تطابق كلمات المرور.',
  })
  @ApiResponse({
    status: 409,
    description: 'البريد الإلكتروني مسجل مسبقاً في النظام.',
  })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '2. تسجيل الدخول إلى المنصة (Trader Login)',
    description:
      '📌 **لازمتها إيه في الفرونت إند:**\n' +
      '- تُربط بفورم تسجيل الدخول في صفحة (/login).\n' +
      '- تُرسل: `{ email, password }`.\n' +
      '- عند النجاح: تُرجع `accessToken` (صالح لمدة ساعة) و `refreshToken` (صالح لمدة 7 أيام) وكائن `user`.\n' +
      '- احفظ الـ `accessToken` في الـ Memory أو LocalStorage/Cookie واستخدمه في هيدر `Authorization: Bearer <token>` لجميع الطلبات المحمية.',
  })
  @ApiResponse({
    status: 200,
    description: 'تم تسجيل الدخول بنجاح.',
  })
  @ApiResponse({ status: 401, description: 'البريد الإلكتروني أو كلمة المرور غير صحيحة.' })
  @ApiResponse({
    status: 429,
    description: 'تجاوزت الحد المسموح من المحاولات الخاطئة. انتظر قليلاً.',
  })
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Get('social-config')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'جلب إعدادات الدخول عبر وسائل التواصل (Google & Apple Client IDs)',
    description: 'يُرجع معرفات الربط السحابي لمعالجة الدخول في واجهة المستخدم.',
  })
  async getSocialConfig() {
    return {
      googleClientId: process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '',
      appleClientId: process.env.APPLE_CLIENT_ID || process.env.NEXT_PUBLIC_APPLE_CLIENT_ID || '',
    };
  }

  @Post('social')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'تسجيل الدخول أو إنشاء حساب عبر Google أو Apple (Social OAuth Login)',
    description:
      '📌 **لازمتها إيه في الفرونت إند:**\n' +
      '- تُربط بأزرار Google و Apple في صفحتي تسجيل الدخول (/login) وإنشاء الحساب (/register).\n' +
      '- تستقبل كائن: `{ provider: "GOOGLE" | "APPLE", idToken: "...", fullName?: "...", email?: "..." }`.\n' +
      '- تتحقق من الرمز وتقوم بإنشاء الحساب فوراً إن لم يكن موجوداً أو تسجيل الدخول إن كان مسجلاً.\n' +
      '- تُرجع التوكنات مباشرة `{ accessToken, refreshToken, user }` دون الحاجة لخطوات إضافية.',
  })
  @ApiResponse({
    status: 200,
    description: 'تمت المصادقة بنجاح وتوليد الجلسة.',
  })
  @ApiResponse({
    status: 400,
    description: 'رمز التحقق غير صالح أو تعذر استخراج البريد الإلكتروني.',
  })
  async socialLogin(@Body() dto: SocialAuthDto) {
    return this.authService.socialAuth(dto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '3. تجديد التوكن تلقائياً بدون تسجيل خروج (Silent Refresh Token)',
    description:
      '📌 **لازمتها إيه في الفرونت إند:**\n' +
      '- تُستدعى عبر Axios Interceptor أو Fetch Wrapper عندما يرجع أي طلب كود `401 Unauthorized`.\n' +
      '- تُرسل: `{ refreshToken: "..." }` في الـ Body.\n' +
      '- السيرفر يقوم بتبديل التوكن المشفر فوراً ويُرجع `accessToken` جديد تماماً مع `refreshToken` جديد.\n' +
      '- تمنع خروج المستخدم المفاجئ أثناء الاستخدام وتحافظ على جلسته نشطة بأمان.',
  })
  @ApiResponse({
    status: 200,
    description: 'تم تجديد التوكنات بنجاح.',
  })
  @ApiResponse({
    status: 401,
    description: 'رمز التجديد منتهي أو غير صالح (يجب توجيه المستخدم لصفحة الدخول).',
  })
  @ApiResponse({
    status: 403,
    description: 'محاولة اختراق أو إعادة استخدام توكن ملغي. تم إلغاء كافة الجلسات.',
  })
  async refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshTokens(dto);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '4. تسجيل الخروج من المتصفح الحالي (Logout Current Device)',
    description:
      '📌 **لازمتها إيه في الفرونت إند:**\n' +
      '- تُستدعى عند ضغط المستخدم على زر "تسجيل الخروج".\n' +
      '- تُرسل: `{ refreshToken: "..." }` لإبطال التوكن في قاعدة البيانات ومنع استخدامه مستقبلاً.\n' +
      '- ثم يقوم الفرونت إند بمسح التوكنات من التخزين المحلي وتوجيه المستخدم لـ `/login`.',
  })
  @ApiResponse({
    status: 200,
    description: 'تم إبطال الجلسة بنجاح.',
  })
  async logout(@Body() dto: RefreshTokenDto) {
    return this.authService.logout(dto);
  }

  @Post('revoke-all')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '5. تسجيل الخروج من كافة الأجهزة والمتصفحات (Global Logout)',
    description:
      '📌 **لازمتها إيه في الفرونت إند:**\n' +
      '- تُربط بزر الأمان في الإعدادات ("تسجيل الخروج من كل الأجهزة الأخرى").\n' +
      '- تُبطل فوراً جميع التوكنات والجلسات المفتوحة للمستخدم على أي هاتف أو كمبيوتر آخر.\n' +
      '- تتطلب تسجيل الدخول (Bearer Token).',
  })
  @ApiResponse({
    status: 200,
    description: 'تم إلغاء كافة الجلسات النشطة بنجاح.',
  })
  @ApiResponse({ status: 401, description: 'غير مصرح أو انتهت صلاحية التوكن.' })
  async revokeAll(@Request() req: any) {
    return this.authService.revokeAllUserSessions(req.user.id);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: '6. جلب بيانات بروفايل المستخدم الحالي (Get Current User Profile)',
    description:
      '📌 **لازمتها إيه في الفرونت إند:**\n' +
      '- تُستدعى عند أول فتح للتطبيق (App Initialization / Auth Provider) للتأكد هل المستخدم ما زال مسجلاً.\n' +
      '- تُرجع بيانات المستخدم: المعرف، الاسم، البريد، الرتبة (FREE/VIP/PRO)، والصلاحيات (Roles).\n' +
      '- تتطلب هيدر: `Authorization: Bearer <token>`.',
  })
  @ApiResponse({ status: 200, description: 'بيانات البروفايل والرتبة الحالية.' })
  @ApiResponse({ status: 401, description: 'التوكن غير صالح أو منتهي الصلاحية.' })
  async getProfile(@Request() req: any) {
    const userProfile = await this.authService.getProfile(req.user.id);
    return {
      success: true,
      user: userProfile,
    };
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'تغيير كلمة المرور للمستخدم المسجل دخوله' })
  @ApiResponse({ status: 200, description: 'تم تحديث كلمة المرور بنجاح' })
  async changePassword(@Request() req: any, @Body() dto: ChangePasswordDto) {
    return this.authService.changePassword(req.user.id, dto);
  }

  @Patch('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'تحديث بيانات الملف الشخصي (الاسم، الهاتف، مستوى الخبرة)' })
  @ApiResponse({ status: 200, description: 'تم تحديث الملف الشخصي بنجاح' })
  async updateProfile(@Request() req: any, @Body() dto: UpdateProfileDto) {
    return this.authService.updateProfile(req.user.id, dto);
  }
}

