import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { SubscriptionsService } from './subscriptions.service';

@ApiTags('Subscription Plans & User Entitlements')
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Get('plans')
  @ApiOperation({
    summary: '1. استعراض باقات الاشتراك المتاحة للجمهور (Public Subscription Plans)',
    description:
      '📌 **لازمتها إيه في الفرونت إند:**\n' +
      '- تُستدعى في صفحة الأسعار والباقات العامة (/pricing أو /subscriptions).\n' +
      '- تُرجع قائمة الباقات النشطة مع: الأسعار، فترات الفوترة (شهري/سنوي)، الوسوم التسويقية (Badge)، ومصفوفة الميزات التسويقية والصلاحيات التقنية.\n' +
      '- لا تتطلب توكن (Public).',
  })
  @ApiResponse({ status: 200, description: 'قائمة باقات المنصة النشطة مع الأسعار والصلاحيات.' })
  async listPublicPlans() {
    return this.subscriptionsService.listPublicPlans();
  }

  @Get('permissions-catalog')
  @ApiOperation({
    summary: '2. كتالوج ميزات وصلاحيات المنصة المعتمدة (Platform Permissions Catalog)',
    description:
      '📌 **لازمتها إيه في الفرونت إند:**\n' +
      '- تُستدعى في صفحة مقارنة الباقات (Feature Comparison Matrix) أو في فورم لوحة الأدمن.\n' +
      '- تُرجع قائمة بكافة ميزات المنصة (إشارات البوت، البثوث، كورسات VIP، التحليل الفني، الشات) مع أسمائها العربية وأيقوناتها وتصنيفاتها.\n' +
      '- لا تتطلب توكن (Public).',
  })
  @ApiResponse({ status: 200, description: 'كتالوج الصلاحيات والميزات التقنية المتاحة في المنصة.' })
  getPermissionsCatalog() {
    return this.subscriptionsService.getPermissionsCatalog();
  }

  @Get('plans/:slug')
  @ApiOperation({
    summary: '3. تفاصيل باقة محددة عبر الاسم الرابطي (Get Plan By Slug)',
    description:
      '📌 **لازمتها إيه في الفرونت إند:**\n' +
      '- تُستدعى عند فتح صفحة تفاصيل باقة مفردة أو شاشة تأكيد الدفع (Checkout Page).\n' +
      '- لا تتطلب توكن (Public).',
  })
  @ApiParam({ name: 'slug', description: 'الاسم الرابطي للباقة (مثال: ultimate-vip-all-access)' })
  async getPlanBySlug(@Param('slug') slug: string) {
    return this.subscriptionsService.getPlanBySlug(slug);
  }

  @Get('my-subscription')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: '4. فحص اشتراك المستخدم الحالي والصلاحيات الفعالة (My Active Subscription)',
    description:
      '📌 **لازمتها إيه في الفرونت إند:**\n' +
      '- تُستدعى في لوحة تحكم المتداول (Dashboard) أو عند محاولة فتح ميزة محمية (مثل غرفة البث أو إشارات البوت).\n' +
      '- تُرجع: هل المستخدم مشترك حالياً (`hasActiveSubscription: true`)؟ وما هي الخطة الحالية وتاريخ الانتهاء والأيام المتبقية (`daysRemaining`)؟\n' +
      '- والأهم: تُرجع مصفوفة `activePermissions` التي تحتوي على جميع الرموز المسموح للمتداول باستخدامها فوراً في الفرونت إند.\n' +
      '- تتطلب تسجيل الدخول: `Authorization: Bearer <token>`.',
  })
  @ApiResponse({ status: 200, description: 'تفاصيل الخطة الفعالة ومصفوفة الصلاحيات الممنوحة للمستخدم.' })
  async getMySubscription(@Request() req: any) {
    return this.subscriptionsService.getUserActiveSubscription(req.user.id);
  }

  @Post('subscribe/:planId')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(OptionalJwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '5. زر الاشتراك وتفعيل الباقة للمتداول (Subscribe to Plan)',
    description:
      '📌 **لازمتها إيه في الفرونت إند:**\n' +
      '- تُربط بزر "اشترك الآن" في كرت الباقة أو إتمام الشراء عبر صفحة /checkout.\n' +
      '- تقوم بتسجيل الدفع، فحص وتطبيق كود الخصم، وتفعيل الباقة وحساب تاريخ نهاية الاشتراك.\n' +
      '- تدعم المستخدم المسجل أو الزائر بإرسال بيانات الدفع.',
  })
  @ApiParam({ name: 'planId', description: 'معرف الباقة (ID أو Slug)' })
  async subscribe(
    @Param('planId') planId: string,
    @Request() req: any,
    @Body() body?: any,
  ) {
    return this.subscriptionsService.subscribeUser(req.user?.id, planId, body);
  }
}
