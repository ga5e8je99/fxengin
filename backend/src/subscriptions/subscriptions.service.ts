import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  OnModuleInit,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';
import { AssignSubscriptionDto } from './dto/assign-subscription.dto';
import { PLATFORM_PERMISSIONS } from './subscriptions.constants';
import { BillingPeriod, SubscriptionStatus, Role } from '@prisma/client';
import { MailService } from '../mail/mail.service';

@Injectable()
export class SubscriptionsService implements OnModuleInit {
  private readonly logger = new Logger(SubscriptionsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) {}

  async onModuleInit() {
    this.seedDefaultPlansIfEmpty().catch((err: any) => {
      this.logger.warn(`Could not seed default subscription plans during boot: ${err?.message || err}`);
    });
  }

  // ==========================================
  // PUBLIC & USER METHODS
  // ==========================================

  /**
   * استعراض قائمة الباقات النشطة المتاحة للجمهور والمتداولين
   */
  async listPublicPlans() {
    const plans = await this.prisma.subscriptionPlan.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    });

    return {
      success: true,
      data: plans.map((plan) => ({
        ...plan,
        price: Number(plan.price),
        features: Array.isArray(plan.features) ? plan.features : [],
        permissions: Array.isArray(plan.permissions) ? plan.permissions : [],
      })),
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * جلب كتالوج الصلاحيات التقنية المعتمدة للمنصة
   */
  getPermissionsCatalog() {
    return {
      success: true,
      data: PLATFORM_PERMISSIONS,
      total: PLATFORM_PERMISSIONS.length,
    };
  }

  /**
   * جلب تفاصيل باقة محددة عبر الـ slug
   */
  async getPlanBySlug(slug: string) {
    const plan = await this.prisma.subscriptionPlan.findUnique({
      where: { slug },
    });

    if (!plan || !plan.isActive) {
      throw new NotFoundException('باقة الاشتراك غير موجودة أو غير مفعلة حالياً');
    }

    return {
      success: true,
      data: {
        ...plan,
        price: Number(plan.price),
        features: Array.isArray(plan.features) ? plan.features : [],
        permissions: Array.isArray(plan.permissions) ? plan.permissions : [],
      },
    };
  }

  /**
   * فحص اشتراك المستخدم الحالي والصلاحيات الفعالة
   */
  async getUserActiveSubscription(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        subscriptions: {
          where: {
            status: SubscriptionStatus.ACTIVE,
            OR: [
              { endDate: null },
              { endDate: { gt: new Date() } },
            ],
          },
          include: {
            plan: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('المستخدم غير موجود');
    }

    const activeSubscriptions = user.subscriptions;
    const isSuperOrAdmin = user.role === Role.ADMIN || user.role === Role.SUPER_ADMIN;

    // تجميع كافة الصلاحيات الممنوحة من جميع الباقات النشطة
    const permissionsSet = new Set<string>();

    if (isSuperOrAdmin) {
      // المشرف يمتلك كافة صلاحيات المنصة تلقائياً
      PLATFORM_PERMISSIONS.forEach((p) => permissionsSet.add(p.key));
    } else {
      activeSubscriptions.forEach((sub) => {
        const perms = Array.isArray(sub.plan.permissions) ? (sub.plan.permissions as string[]) : [];
        perms.forEach((p) => permissionsSet.add(p));
      });
    }

    const primarySubscription = activeSubscriptions[0] || null;

    let daysRemaining: number | null = null;
    if (primarySubscription?.endDate) {
      const diffMs = primarySubscription.endDate.getTime() - Date.now();
      daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    }

    const permsList = Array.from(permissionsSet);
    const unlockedFeatures = permsList.map((key) => {
      const def = PLATFORM_PERMISSIONS.find((p) => p.key === key);
      let actionUrl = '/';
      if (key === 'BOT_SIGNALS_ACCESS') actionUrl = '/analysis/XAUUSD';
      if (key === 'LIVE_STREAMING_ACCESS') actionUrl = '/live';
      if (key === 'ACADEMY_COURSES_VIP') actionUrl = '/courses';
      if (key === 'INSTITUTIONAL_DESK') actionUrl = '/analysis/XAUUSD';
      if (key === 'TELEGRAM_VIP_COMMUNITY') actionUrl = 'https://t.me/+fxengin_vip_community';
      if (key === 'LIVE_CHAT_PRIVILEGE') actionUrl = '/live';
      if (key === 'OFFLINE_DOWNLOADS_PDF') actionUrl = '/courses';

      return {
        key,
        nameAr: def ? def.nameAr : key,
        descriptionAr: def ? def.descriptionAr : '',
        actionUrl,
        status: 'UNLOCKED',
      };
    });

    return {
      success: true,
      data: {
        hasActiveSubscription: activeSubscriptions.length > 0 || isSuperOrAdmin,
        isPrivilegedRole: isSuperOrAdmin,
        activeSubscriptionsCount: activeSubscriptions.length,
        primaryPlan: primarySubscription
          ? {
              id: primarySubscription.plan.id,
              name: primarySubscription.plan.name,
              slug: primarySubscription.plan.slug,
              badge: primarySubscription.plan.badge,
              billingPeriod: primarySubscription.plan.billingPeriod,
              startDate: primarySubscription.startDate,
              endDate: primarySubscription.endDate,
              daysRemaining,
            }
          : null,
        activePermissions: permsList,
        unlockedFeatures,
      },
    };
  }

  /**
   * فحص سريع لصلاحية معينة لمستخدم
   */
  async checkUserFeature(userId: string, featureKey: string): Promise<boolean> {
    const res = await this.getUserActiveSubscription(userId);
    return res.data.activePermissions.includes(featureKey);
  }

  /**
   * اشتراك المستخدم في باقة (دفع مباشر، كود تفعيل، أو تواصل الدعم مع فحص كوبونات الخصم)
   */
  async subscribeUser(userId?: string, planIdOrSlug?: string, paymentData?: any) {
    let targetUserId = userId;
    let user = targetUserId ? await this.prisma.user.findUnique({ where: { id: targetUserId } }) : null;

    if (!user) {
      const email = paymentData?.buyerEmail || paymentData?.email;
      if (email) {
        const cleanEmail = String(email).trim().toLowerCase();
        user = await this.prisma.user.findUnique({ where: { email: cleanEmail } });
        if (!user) {
          user = await this.prisma.user.create({
            data: {
              email: cleanEmail,
              fullName: paymentData?.buyerName || paymentData?.fullName || 'مشترك VIP',
              phoneNumber: paymentData?.buyerPhone || paymentData?.phone || null,
              passwordHash: '$2b$10$defaultHashForPurchasedGuestAccountsFXENGIN',
              role: Role.VIP,
            },
          });
        }
        targetUserId = user.id;
      } else {
        throw new BadRequestException('يجب تسجيل الدخول أو إدخال البريد الإلكتروني لإتمام الاشتراك');
      }
    }

    if (!planIdOrSlug) {
      throw new BadRequestException('معرف باقة الاشتراك مطلوب');
    }

    const plan = await this.prisma.subscriptionPlan.findFirst({
      where: {
        OR: [{ id: planIdOrSlug }, { slug: planIdOrSlug }],
        isActive: true,
      },
    });

    if (!plan) {
      throw new NotFoundException('باقة الاشتراك المطلوبة غير متوفرة أو معطلة');
    }

    // احتساب تاريخ نهاية الاشتراك بحسب دورة الفاتورة
    const startDate = new Date();
    let endDate: Date | null = null;

    switch (plan.billingPeriod) {
      case BillingPeriod.MONTHLY:
        endDate = new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000);
        break;
      case BillingPeriod.QUARTERLY:
        endDate = new Date(startDate.getTime() + 90 * 24 * 60 * 60 * 1000);
        break;
      case BillingPeriod.SEMI_ANNUAL:
        endDate = new Date(startDate.getTime() + 180 * 24 * 60 * 60 * 1000);
        break;
      case BillingPeriod.ANNUAL:
        endDate = new Date(startDate.getTime() + 365 * 24 * 60 * 60 * 1000);
        break;
      case BillingPeriod.LIFETIME:
        endDate = null;
        break;
    }

    // حساب الخصم المعتمد في حال إرسال كود خصم أو كود تفعيل
    let finalPaid = Number(plan.price);
    let discountAmount = 0;
    let appliedCoupon: string | null = null;

    const promoOrAccessCode = (paymentData?.couponCode || paymentData?.accessCode)?.trim()?.toUpperCase();

    if (promoOrAccessCode) {
      const coupon = await this.prisma.coupon.findUnique({ where: { code: promoOrAccessCode } });
      if (coupon && coupon.isActive) {
        // التحقق من تاريخ انتهاء الكوبون وحدود الاستخدام
        const isExpired = coupon.expiresAt && new Date() > new Date(coupon.expiresAt);
        const isMaxedOut = coupon.maxUses && coupon.usedCount >= coupon.maxUses;
        if (!isExpired && !isMaxedOut) {
          appliedCoupon = coupon.code;
          const discountVal = Number(coupon.discountValue);
          if (coupon.discountType === 'PERCENTAGE') {
            discountAmount = (finalPaid * discountVal) / 100;
            if (coupon.maxDiscount && discountAmount > Number(coupon.maxDiscount)) {
              discountAmount = Number(coupon.maxDiscount);
            }
          } else {
            discountAmount = discountVal;
          }
          discountAmount = Math.round(discountAmount * 100) / 100;
          finalPaid = Math.max(0, Math.round((finalPaid - discountAmount) * 100) / 100);

          // زيادة عدد مرات استخدام الكوبون
          await this.prisma.coupon.update({
            where: { id: coupon.id },
            data: { usedCount: { increment: 1 } },
          });
        }
      } else if (paymentData?.paymentMethod === 'code' || paymentData?.accessCode) {
        throw new BadRequestException('كود التفعيل أو القسيمة غير صالح أو منتهي الصلاحية');
      }
    } else if (paymentData?.paymentMethod === 'code' || paymentData?.accessCode) {
      throw new BadRequestException('يرجى إدخال كود تفعيل صالح');
    }

    // التحقق من حالة التفعيل: تفعيل فوري إذا كانت الباقة مجانية أو الخصم 100%
    const isInstantActivation = finalPaid === 0 || user.role === Role.ADMIN || user.role === Role.SUPER_ADMIN;
    const providedTxId = paymentData?.txId?.trim() || paymentData?.accessCode?.trim() || null;

    if (!isInstantActivation && !providedTxId) {
      throw new BadRequestException('يرجى إدخال تفاصيل الدفع ورقم المعاملة (TXID) لتأكيد طلب الاشتراك.');
    }

    const subStatus = isInstantActivation ? SubscriptionStatus.ACTIVE : SubscriptionStatus.TRIAL;

    // إنشاء سجل الاشتراك
    const subscription = await this.prisma.userSubscription.create({
      data: {
        userId: targetUserId!,
        planId: plan.id,
        status: subStatus,
        startDate,
        endDate,
        autoRenew: plan.billingPeriod !== BillingPeriod.LIFETIME,
        paymentReference: providedTxId || `PAY_${Date.now()}`,
        paidAmount: finalPaid,
        currency: paymentData?.currency || plan.currency || 'USD',
        paymentMethod: paymentData?.paymentMethod || (finalPaid === 0 ? 'FREE' : 'USDT_TRC20'),
        couponCode: appliedCoupon,
        discountAmount: discountAmount,
        txId: providedTxId,
        buyerName: paymentData?.buyerName || paymentData?.fullName || user.fullName,
        buyerEmail: paymentData?.buyerEmail || paymentData?.email || user.email,
        buyerPhone: paymentData?.buyerPhone || paymentData?.phone || user.phoneNumber,
      },
      include: {
        plan: true,
      },
    });

    // ترقية رتبة المستخدم إلى VIP فقط إذا تم التفعيل الفعلي
    if (isInstantActivation && user.role === Role.USER) {
      await this.prisma.user.update({
        where: { id: targetUserId! },
        data: { role: Role.VIP },
      });
    }

    // إرسال بريد رسمي بتأكيد الاشتراك والمميزات عبر Gmail
    const targetEmail = paymentData?.buyerEmail || paymentData?.email || user.email;
    const targetName = paymentData?.buyerName || paymentData?.fullName || user.fullName;
    if (targetEmail) {
      this.mailService
        .sendSubscriptionEmail(
          targetEmail,
          targetName || 'المتداول',
          plan.name,
          `${finalPaid} ${subscription.currency}`,
          endDate ? endDate.toLocaleDateString('ar-EG') : undefined,
        )
        .catch((err) => this.logger.error(`Failed to send subscription email to ${targetEmail}: ${err.message}`));
    }

    // تحديث رصيد حساب التداول التجريبي (10x من المبلغ المدفوع)
    if (targetUserId) {
      this.syncUserTradingAccountDemoBalance(targetUserId).catch(() => {});
    }

    const perms = Array.isArray(plan.permissions) ? (plan.permissions as string[]) : [];

    // فتح الكورسات تلقائياً: إذا تضمنت الباقة صلاحية ACADEMY_COURSES_VIP يتم تسجيل الطالب في كافة الكورسات المنشورة فقط عند التفعيل المعتمد
    if (isInstantActivation && perms.includes('ACADEMY_COURSES_VIP')) {
      const publishedCourses = await this.prisma.course.findMany({
        where: { isPublished: true },
        select: { id: true },
      });

      for (const course of publishedCourses) {
        await this.prisma.courseEnrollment.upsert({
          where: {
            userId_courseId: {
              userId: targetUserId!,
              courseId: course.id,
            },
          },
          create: {
            userId: targetUserId!,
            courseId: course.id,
            paidAmount: 0,
            paymentMethod: 'VIP_BUNDLE',
            status: 'COMPLETED',
            buyerName: user.fullName,
            buyerEmail: user.email,
          },
          update: {},
        });
      }
    }

    this.logger.log(`User ${user.email} subscribed to plan: ${plan.name} (Paid: ${finalPaid} USDT, Status: ${subStatus})`);

    const successMsg = isInstantActivation
      ? `تم تفعيل اشتراكك في باقة ${plan.name} بنجاح!`
      : `تم استلام طلب اشتراكك في باقة ${plan.name} ورقم المعاملة بنجاح! طلبك قيد التحقق الفوري من قبل الإدارة وسيتم تفعيل الباقة فور التأكيد.`;

    return {
      success: true,
      message: successMsg,
      isPendingVerification: !isInstantActivation,
      data: {
        subscriptionId: subscription.id,
        status: subscription.status,
        plan: subscription.plan,
        paidAmount: finalPaid,
        startDate: subscription.startDate,
        endDate: subscription.endDate,
        activePermissions: isInstantActivation ? perms : [],
      },
    };

    // تجميع الميزات المفتوحة بروابطها المباشرة
    const unlockedFeatures = perms.map((key) => {
      const def = PLATFORM_PERMISSIONS.find((p) => p.key === key);
      let actionUrl = '/';
      if (key === 'BOT_SIGNALS_ACCESS') actionUrl = '/analysis/XAUUSD';
      if (key === 'LIVE_STREAMING_ACCESS') actionUrl = '/live';
      if (key === 'ACADEMY_COURSES_VIP') actionUrl = '/courses';
      if (key === 'INSTITUTIONAL_DESK') actionUrl = '/analysis/XAUUSD';
      if (key === 'TELEGRAM_VIP_COMMUNITY') actionUrl = 'https://t.me/+fxengin_vip_community';
      if (key === 'LIVE_CHAT_PRIVILEGE') actionUrl = '/live';
      if (key === 'OFFLINE_DOWNLOADS_PDF') actionUrl = '/courses';

      return {
        key,
        nameAr: def ? def.nameAr : key,
        descriptionAr: def ? def.descriptionAr : '',
        actionUrl,
        status: 'UNLOCKED',
      };
    });

    return {
      success: true,
      message: `تهانينا! تم تفعيل ${plan?.name || 'الباقة'} لحسابك وفتح كافة الميزات والصلاحيات المحددة تلقائياً.`,
      data: {
        subscriptionId: subscription.id,
        planName: plan?.name || 'VIP',
        startDate: subscription.startDate,
        endDate: subscription.endDate,
        permissions: plan?.permissions || [],
        unlockedFeatures,
      },
    };
  }

  // ==========================================
  // ADMIN MANAGEMENT METHODS
  // ==========================================

  /**
   * استعراض كافة الباقات في لوحة الإدارة مع عدد المشتركين
   */
  async adminListPlans() {
    const plans = await this.prisma.subscriptionPlan.findMany({
      include: {
        _count: {
          select: {
            subscriptions: {
              where: { status: SubscriptionStatus.ACTIVE },
            },
          },
        },
      },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    });

    return {
      success: true,
      data: plans.map((p) => ({
        ...p,
        price: Number(p.price),
        activeSubscribersCount: p._count.subscriptions,
        features: Array.isArray(p.features) ? p.features : [],
        permissions: Array.isArray(p.permissions) ? p.permissions : [],
      })),
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * إنشاء باقة جديدة من لوحة الإدارة
   */
  async adminCreatePlan(dto: CreatePlanDto) {
    const existing = await this.prisma.subscriptionPlan.findUnique({
      where: { slug: dto.slug },
    });

    if (existing) {
      throw new ConflictException('الاسم الرابطي (slug) مستخدم بالفعل لباقة أخرى');
    }

    const plan = await this.prisma.subscriptionPlan.create({
      data: {
        name: dto.name,
        slug: dto.slug,
        description: dto.description,
        price: dto.price,
        currency: dto.currency || 'USD',
        billingPeriod: dto.billingPeriod as BillingPeriod,
        badge: dto.badge || null,
        highlightColor: dto.highlightColor || '#FC8702',
        isActive: dto.isActive !== undefined ? dto.isActive : true,
        sortOrder: dto.sortOrder || 0,
        features: dto.features,
        permissions: dto.permissions,
      },
    });

    return {
      success: true,
      message: 'تم إنشاء باقة الاشتراك بنجاح وتعيين صلاحياتها',
      data: {
        ...plan,
        price: Number(plan.price),
      },
    };
  }

  /**
   * تحديث باقة موجودة
   */
  async adminUpdatePlan(id: string, dto: UpdatePlanDto) {
    const plan = await this.prisma.subscriptionPlan.findUnique({
      where: { id },
    });

    if (!plan) {
      throw new NotFoundException('باقة الاشتراك غير موجودة');
    }

    if (dto.slug && dto.slug !== plan.slug) {
      const slugExists = await this.prisma.subscriptionPlan.findUnique({
        where: { slug: dto.slug },
      });
      if (slugExists) {
        throw new ConflictException('الاسم الرابطي (slug) مستخدم بالفعل');
      }
    }

    const updated = await this.prisma.subscriptionPlan.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.slug && { slug: dto.slug }),
        ...(dto.description && { description: dto.description }),
        ...(dto.price !== undefined && { price: dto.price }),
        ...(dto.currency && { currency: dto.currency }),
        ...(dto.billingPeriod && { billingPeriod: dto.billingPeriod as BillingPeriod }),
        ...(dto.badge !== undefined && { badge: dto.badge }),
        ...(dto.highlightColor && { highlightColor: dto.highlightColor }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
        ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
        ...(dto.features && { features: dto.features }),
        ...(dto.permissions && { permissions: dto.permissions }),
      },
    });

    return {
      success: true,
      message: 'تم تحديث بيانات الباقة بنجاح',
      data: {
        ...updated,
        price: Number(updated.price),
      },
    };
  }

  /**
   * حذف باقة اشتراك
   */
  async adminDeletePlan(id: string) {
    const plan = await this.prisma.subscriptionPlan.findUnique({
      where: { id },
      include: {
        _count: { select: { subscriptions: true } },
      },
    });

    if (!plan) {
      throw new NotFoundException('الباقة غير موجودة');
    }

    if (plan._count.subscriptions > 0) {
      // تعطيل الباقة بدلاً من الحذف الفيزيائي للحفاظ على سجلات المشتركين
      await this.prisma.subscriptionPlan.update({
        where: { id },
        data: { isActive: false },
      });
      return {
        success: true,
        message: 'تم تعطيل الباقة وحجبها عن المشتركين الجدد لوجود اشتراكات نشطة مرتبطة بها.',
      };
    }

    await this.prisma.subscriptionPlan.delete({ where: { id } });
    return {
      success: true,
      message: 'تم حذف الباقة نهائياً من النظام.',
    };
  }

  /**
   * منح اشتراك يدوي لمستخدم من لوحة الإدارة
   */
  async adminAssignSubscription(dto: AssignSubscriptionDto) {
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ id: dto.userIdentifier }, { email: dto.userIdentifier }],
      },
    });

    if (!user) {
      throw new NotFoundException('المستخدم المطلوب غير موجود بالبريد أو المعرف المدخل');
    }

    const plan = await this.prisma.subscriptionPlan.findFirst({
      where: {
        OR: [{ id: dto.planIdentifier }, { slug: dto.planIdentifier }],
      },
    });

    if (!plan) {
      throw new NotFoundException('الباقة المطلوبة غير موجودة');
    }

    const startDate = new Date();
    const days = dto.durationDays !== undefined ? dto.durationDays : 30;
    const endDate = days > 0 ? new Date(startDate.getTime() + days * 24 * 60 * 60 * 1000) : null;

    const sub = await this.prisma.userSubscription.create({
      data: {
        userId: user.id,
        planId: plan.id,
        status: SubscriptionStatus.ACTIVE,
        startDate,
        endDate,
        autoRenew: false,
        paymentReference: dto.paymentReference || 'ADMIN_MANUAL_OVERRIDE',
      },
      include: {
        user: { select: { id: true, email: true, fullName: true } },
        plan: { select: { id: true, name: true, slug: true } },
      },
    });

    // ترقية الرتبة
    await this.prisma.user.update({
      where: { id: user.id },
      data: { role: Role.VIP },
    });

    const perms = Array.isArray(plan.permissions) ? (plan.permissions as string[]) : [];

    // فتح الكورسات تلقائياً للمستخدم الممنوح اشتراكه
    if (perms.includes('ACADEMY_COURSES_VIP')) {
      const publishedCourses = await this.prisma.course.findMany({
        where: { isPublished: true },
        select: { id: true },
      });

      for (const course of publishedCourses) {
        await this.prisma.courseEnrollment.upsert({
          where: {
            userId_courseId: {
              userId: user.id,
              courseId: course.id,
            },
          },
          create: {
            userId: user.id,
            courseId: course.id,
          },
          update: {},
        });
      }
    }

    const unlockedFeatures = perms.map((key) => {
      const def = PLATFORM_PERMISSIONS.find((p) => p.key === key);
      let actionUrl = '/';
      if (key === 'BOT_SIGNALS_ACCESS') actionUrl = '/analysis/XAUUSD';
      if (key === 'LIVE_STREAMING_ACCESS') actionUrl = '/live';
      if (key === 'ACADEMY_COURSES_VIP') actionUrl = '/courses';
      if (key === 'INSTITUTIONAL_DESK') actionUrl = '/analysis/XAUUSD';
      if (key === 'TELEGRAM_VIP_COMMUNITY') actionUrl = 'https://t.me/+fxengin_vip_community';
      if (key === 'LIVE_CHAT_PRIVILEGE') actionUrl = '/live';
      if (key === 'OFFLINE_DOWNLOADS_PDF') actionUrl = '/courses';

      return {
        key,
        nameAr: def ? def.nameAr : key,
        descriptionAr: def ? def.descriptionAr : '',
        actionUrl,
        status: 'UNLOCKED',
      };
    });

    return {
      success: true,
      message: `تم منح ${plan.name} بنجاح للمستخدم ${user.fullName} (${user.email}) وفتح الصلاحيات تلقائياً.`,
      data: {
        ...sub,
        unlockedFeatures,
      },
    };
  }

  /**
   * تقرير شامل بكافة الاشتراكات والمستخدمين
   */
  async adminListSubscribers() {
    const subscriptions = await this.prisma.userSubscription.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            phoneNumber: true,
            role: true,
          },
        },
        plan: {
          select: {
            id: true,
            name: true,
            slug: true,
            price: true,
            billingPeriod: true,
            permissions: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });

    return {
      success: true,
      data: subscriptions.map((s) => ({
        ...s,
        paidAmount: s.paidAmount != null ? Number(s.paidAmount) : (s.plan ? Number(s.plan.price) : 0),
        discountAmount: s.discountAmount != null ? Number(s.discountAmount) : 0,
        plan: s.plan
          ? {
              ...s.plan,
              price: Number(s.plan.price),
            }
          : null,
      })),
      total: subscriptions.length,
    };
  }

  /**
   * إحصائيات سريعة للوحة التحكم
   */
  async adminGetStats() {
    const [totalPlans, activePlans, activeSubscribers] = await Promise.all([
      this.prisma.subscriptionPlan.count(),
      this.prisma.subscriptionPlan.count({ where: { isActive: true } }),
      this.prisma.userSubscription.count({ where: { status: SubscriptionStatus.ACTIVE } }),
    ]);

    return {
      success: true,
      data: {
        totalPlans,
        activePlans,
        activeSubscribers,
      },
    };
  }

  /**
   * بذر مجموعات التحليلات الافتراضية إذا كانت قاعدة البيانات فارغة
   */
  private async seedDefaultPlansIfEmpty() {
    const count = await this.prisma.subscriptionPlan.count();
    if (count > 0) return;

    this.logger.log('Seeding initial analysis groups into fxengin_db...');

    const goldPlan: CreatePlanDto = {
      name: 'مجموعة الذهب',
      slug: 'gold',
      description: 'جروب وتغطية حصرية لتحليلات وإشارات الذهب (XAU/USD) الحية لحظة بلحظة من شارتات MT5 مع مناطق الدخول ووقف الخسارة وجني الأرباح ونماذج السيولة الذكية SMC.',
      price: 200.0,
      currency: 'USD',
      billingPeriod: BillingPeriod.MONTHLY as any,
      badge: 'الأكثر طلباً • مجموعة الذهب 🟡',
      highlightColor: '#FB8704',
      isActive: true,
      sortOrder: 1,
      features: [
        'تغطية حية ومباشرة لتحليلات صفقات الذهب (XAU/USD)',
        'شارتات MT5 لحظية ملتقطة مباشرة من خوادم التداول',
        'مصفوفة إحداثيات رقمية دقيقة: الدخول، TP1، TP2، والوقف',
        'تحليل السيولة البنكية SMC ونماذج Order Blocks و FVG',
        'تحديثات فورية وتنبيهات مستمرة على مدار 24/5',
        'طلب لقطة شارت جديدة لحظياً (Fresh Snapshot)',
        'اشتراك شهري مباشر وتفعيل فوري للتحليلات',
      ],
      permissions: [
        'GOLD_VIP_SIGNALS',
        'BOT_SIGNALS_ACCESS',
        'INSTITUTIONAL_DESK',
        'TELEGRAM_VIP_COMMUNITY',
        'LIVE_CHAT_PRIVILEGE',
      ],
    };

    const indicesPlan: CreatePlanDto = {
      name: 'مجموعة Index',
      slug: 'indices',
      description: 'جروب التحليلات الخاص بمؤشرات الأسهم الأمريكية (داو جونز US30 وناسداك NAS100) وأسواق الطاقة (النفط والغاز) والمعادن الثمينة (الفضة).',
      price: 100.0,
      currency: 'USD',
      billingPeriod: BillingPeriod.MONTHLY as any,
      badge: 'المؤشرات والسلع 🟣',
      highlightColor: '#A855F7',
      isActive: true,
      sortOrder: 2,
      features: [
        'تحليلات مؤشرات وول ستريت العالمية (US30 Dow و NAS100 Nasdaq)',
        'تغطية صفقات أسواق الطاقة: النفط الأمريكي والغاز الطبيعي',
        'إشارات وتحليلات معدن الفضة (XAG/USD)',
        'إحداثيات ومستويات الوقف والأهداف ونسب المخاطرة للعائد',
        'تنبيهات خاصة بفترات السيولة في افتتاح الجلسات الأمريكية والأوروبية',
        'اشتراك شهري مباشر وتفعيل فوري للتحليلات',
      ],
      permissions: [
        'INDICES_VIP_SIGNALS',
        'COMMODITIES_VIP_SIGNALS',
        'INSTITUTIONAL_DESK',
        'TELEGRAM_VIP_COMMUNITY',
        'LIVE_CHAT_PRIVILEGE',
      ],
    };

    const forexPlan: CreatePlanDto = {
      name: 'مجموعة الفوريكس',
      slug: 'forex',
      description: 'جروب تحليلات أزواج العملات الأجنبية الرئيسية والتقاطعات اللحظية بمستويات دخول وخروج دقيقة وهيكل السيولة البنكية.',
      price: 50.0,
      currency: 'USD',
      billingPeriod: BillingPeriod.MONTHLY as any,
      badge: 'أزواج العملات 🔵',
      highlightColor: '#0488F8',
      isActive: true,
      sortOrder: 3,
      features: [
        'تغطية أزواج العملات الرئيسية (EUR/USD, GBP/USD, USD/JPY...)',
        'إحداثيات دخول وخروج لحظية مع مستويات وقف الخسارة والأهداف',
        'تحديثات هيكل السوق والسيولة البنكية (SMC Structure)',
        'تنبيهات فورية عند تشكل فرص التداول اللحظية على مدار 24/5',
        'اشتراك شهري مباشر وتفعيل فوري للتحليلات',
      ],
      permissions: [
        'FOREX_VIP_SIGNALS',
        'INSTITUTIONAL_DESK',
        'TELEGRAM_VIP_COMMUNITY',
        'LIVE_CHAT_PRIVILEGE',
      ],
    };

    await this.adminCreatePlan(goldPlan);
    await this.adminCreatePlan(indicesPlan);
    await this.adminCreatePlan(forexPlan);

    this.logger.log('✅ Successfully seeded 3 default high-value analysis groups.');
  }

  /**
   * مزامنة رصيد حساب التداول التجريبي للمستخدم وفق قاعدة (10 × إجمالي المدفوع في الجروبات والكورسات)
   */
  async syncUserTradingAccountDemoBalance(userId: string) {
    try {
      const activeSubs = await this.prisma.userSubscription.findMany({
        where: {
          userId,
          status: SubscriptionStatus.ACTIVE,
          OR: [{ endDate: null }, { endDate: { gt: new Date() } }],
        },
        include: { plan: true },
      });

      const uniquePlans = new Set<string>();
      let totalSubsTier = 0;
      for (const sub of activeSubs) {
        if (!sub.plan || uniquePlans.has(sub.planId)) continue;
        uniquePlans.add(sub.planId);
        const slug = (sub.plan.slug || '').toLowerCase();
        const name = (sub.plan.name || '').toLowerCase();
        if (slug.includes('gold') || name.includes('ذهب') || name.includes('gold')) {
          totalSubsTier += 50000;
        } else if (slug.includes('ind') || name.includes('اندكس') || name.includes('انديكس') || name.includes('index')) {
          totalSubsTier += 10000;
        } else if (slug.includes('forex') || name.includes('فوركس') || name.includes('فوريكس') || name.includes('forex')) {
          totalSubsTier += 5000;
        } else {
          totalSubsTier += 5000;
        }
      }

      const enrollments = await this.prisma.courseEnrollment.findMany({
        where: {
          userId,
          status: { in: ['COMPLETED', 'ACTIVE'] },
        },
        include: { course: true },
      });
      const uniqueCourses = new Set<string>();
      for (const enr of enrollments) {
        if (enr.courseId) uniqueCourses.add(enr.courseId);
      }
      const totalCoursesTier = uniqueCourses.size * 25000;

      const targetCompetitionBalance = totalSubsTier + totalCoursesTier;

      const existingAccount = await this.prisma.tradingAccount.findFirst({
        where: { userId },
      });

      if (existingAccount) {
        const currentInitial = Number(existingAccount.initialBalance);
        const diff = targetCompetitionBalance - currentInitial;
        const newBalance = Math.max(0, Number(existingAccount.balance) + diff);
        const newEquity = Math.max(0, Number(existingAccount.equity) + diff);
        const newFreeMargin = Math.max(0, Number(existingAccount.freeMargin) + diff);

        await this.prisma.tradingAccount.update({
          where: { id: existingAccount.id },
          data: {
            initialBalance: targetCompetitionBalance,
            balance: newBalance,
            equity: newEquity,
            freeMargin: newFreeMargin,
            brokerServer: 'FXENGIN Competition Server',
            status: 'ACTIVE',
          },
        });
        this.logger.log(`[Competition Balance Sync] Updated trading account #${existingAccount.accountNumber} for user ${userId} to ${targetCompetitionBalance}$`);
      } else {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        const accountNumber = String(600000 + Math.floor(Math.random() * 399999));
        await this.prisma.tradingAccount.create({
          data: {
            accountNumber,
            accountName: user?.fullName || 'حساب المسابقة',
            userId,
            brokerServer: 'FXENGIN Competition Server',
            initialBalance: targetCompetitionBalance,
            balance: targetCompetitionBalance,
            equity: targetCompetitionBalance,
            freeMargin: targetCompetitionBalance,
            margin: 0,
            marginLevel: 0,
            leverage: 100,
            status: 'ACTIVE',
          },
        });
        this.logger.log(`[Competition Balance Sync] Created trading account for user ${userId} with balance ${targetCompetitionBalance}$`);
      }
    } catch (e: any) {
      this.logger.warn(`Could not sync trading account for user ${userId}: ${e.message}`);
    }
  }
}
