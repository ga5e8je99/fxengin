import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { ProductType, ActivationCodeStatus, EntitlementStatus, OrderStatus } from '@prisma/client';
import * as crypto from 'crypto';

interface RateLimitEntry {
  attempts: number;
  blockedUntil: number;
}

@Injectable()
export class ActivationService {
  private readonly logger = new Logger(ActivationService.name);
  private readonly secretSalt: string;
  private readonly rateLimitMap = new Map<string, RateLimitEntry>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) {
    this.secretSalt =
      process.env.ACTIVATION_SECRET_SALT ||
      process.env.ENCRYPTION_SECRET_KEY ||
      'fxengin_super_secure_activation_salt_2026_production_hmac';
  }

  /**
   * حساب الهاش المشفر لكود التفعيل لمنع تخزين الكود كنص صريح في قاعدة البيانات
   */
  hashActivationCode(code: string): string {
    const normalized = code.trim().toUpperCase().replace(/[^A-Z0-9-]/g, '');
    return crypto.createHmac('sha256', this.secretSalt).update(normalized).digest('hex');
  }

  /**
   * توليد كود تفعيل مشفر عشوائي بالكامل باستخدام CSPRNG بنمط FXG-XXXX-XXXX-XXXX
   */
  generateCryptographicCode(): string {
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    const generateSegment = (length: number) => {
      const bytes = crypto.randomBytes(length);
      let segment = '';
      for (let i = 0; i < length; i++) {
        segment += chars[bytes[i] % chars.length];
      }
      return segment;
    };

    return `FXG-${generateSegment(4)}-${generateSegment(4)}-${generateSegment(4)}`;
  }

  /**
   * 1. إصدار وتوليد كود تفعيل لطلب معتمد وتخزينه كـ HMAC Hash وإرساله للمشتري بالبريد الإلكتروني
   */
  async generateCodeForOrder(orderId: string, adminNotes?: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { user: true },
    });

    if (!order) {
      throw new NotFoundException('الطلب غير موجود');
    }

    // توليد كود فريد والتأكد من عدم وجود تصادم للهاش
    let rawCode = this.generateCryptographicCode();
    let codeHash = this.hashActivationCode(rawCode);
    let attempts = 0;

    while (attempts < 5) {
      const exists = await this.prisma.activationCode.findUnique({ where: { codeHash } });
      if (!exists) break;
      rawCode = this.generateCryptographicCode();
      codeHash = this.hashActivationCode(rawCode);
      attempts++;
    }

    const segments = rawCode.split('-');
    const displayPrefix = `${segments[0]}-****-${segments[segments.length - 1]}`;

    const activationRecord = await this.prisma.activationCode.create({
      data: {
        codeHash,
        displayPrefix,
        userId: order.userId,
        orderId: order.id,
        productId: order.productId,
        productType: order.productType,
        status: ActivationCodeStatus.UNUSED,
        maxActivations: 1,
        activationCount: 0,
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // صالح لسنة كاملة
        metadata: {
          adminNotes: adminNotes || null,
          issuedAt: new Date().toISOString(),
        },
      },
    });

    // تسجيل التدقيق الأمني
    await this.prisma.securityAuditLog.create({
      data: {
        userId: order.userId,
        action: 'ACTIVATION_CODE_GENERATED',
        entityType: 'ACTIVATION_CODE',
        entityId: activationRecord.id,
        metadata: {
          orderNumber: order.orderNumber,
          displayPrefix,
          productType: order.productType,
        },
      },
    });

    // إرسال الكود في بريد رسمي جميل للطالب
    if (order.user?.email) {
      this.mailService
        .sendActivationCodeEmail(
          order.user.email,
          order.user.fullName || 'المتداول',
          order.productTitle,
          rawCode,
          order.productType,
        )
        .catch((err) => this.logger.error(`Failed to dispatch activation email: ${err.message}`));
    }

    this.logger.log(`Issued Activation Code [${displayPrefix}] for Order ${order.orderNumber} (User: ${order.user.email})`);

    return {
      success: true,
      activationCodeId: activationRecord.id,
      code: rawCode, // يُرجع مرة واحدة فقط عند الإنشاء للإدارة
      displayPrefix,
      orderNumber: order.orderNumber,
      userId: order.userId,
      userEmail: order.user?.email,
      productTitle: order.productTitle,
    };
  }

  /**
   * 2. تفعيل الكود من قبل المستخدم ومنح ترخيص الوصول (Entitlement)
   */
  async activateCode(userId: string, inputCode: string, clientIp?: string) {
    // التحقق من محدد معدل المحاولات (Rate Limiting) لمنع هجمات القوة الغاشمة Brute Force
    const ipKey = clientIp || userId;
    this.checkRateLimit(ipKey);

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('المستخدم غير موجود');
    }

    const cleanCode = inputCode.trim().toUpperCase().replace(/[^A-Z0-9-]/g, '');
    if (!cleanCode || cleanCode.length < 10) {
      this.recordFailedAttempt(ipKey);
      throw new BadRequestException('صيغة كود التفعيل غير صحيحة');
    }

    const codeHash = this.hashActivationCode(cleanCode);

    const activationRecord = await this.prisma.activationCode.findUnique({
      where: { codeHash },
      include: {
        order: true,
        user: { select: { id: true, email: true, fullName: true } },
      },
    });

    if (!activationRecord) {
      this.recordFailedAttempt(ipKey);
      throw new BadRequestException('كود التفعيل غير صحيح أو غير مسجل في النظام');
    }

    // 1. فحص الإلغاء
    if (activationRecord.status === ActivationCodeStatus.REVOKED) {
      throw new ForbiddenException('تم إلغاء صلاحية هذا الكود من قبل الإدارة المالية');
    }

    // 2. فحص الانتهاء الزمني
    if (activationRecord.status === ActivationCodeStatus.EXPIRED ||
        (activationRecord.expiresAt && new Date(activationRecord.expiresAt) < new Date())) {
      throw new BadRequestException('هذا الكود منتهي الصلاحية');
    }

    // 3. فحص التفعيل المسبق (Replay Prevention)
    if (activationRecord.status === ActivationCodeStatus.ACTIVATED ||
        activationRecord.activationCount >= activationRecord.maxActivations) {
      throw new BadRequestException('تم استخدام وتفعيل هذا الكود مسبقاً ولا يمكن استخدامه مجدداً');
    }

    // 4. فحص ملكية الكود (User Ownership Binding)
    // الكود الخاص بالمستخدم (أ) لا يعمل إطلاقاً مع المستخدم (ب)!
    if (activationRecord.userId !== userId) {
      await this.prisma.securityAuditLog.create({
        data: {
          userId,
          action: 'ACTIVATION_ATTEMPT_WRONG_USER',
          entityType: 'ACTIVATION_CODE',
          entityId: activationRecord.id,
          metadata: {
            attemptedByUserId: userId,
            boundUserId: activationRecord.userId,
            displayPrefix: activationRecord.displayPrefix,
          },
        },
      });
      throw new ForbiddenException('هذا الكود مخصص لحساب مستخدم آخر ولا يمكن تفعيله من هذا الحساب');
    }

    // 5. فحص حالة سداد الطلب
    if (activationRecord.order && activationRecord.order.status !== OrderStatus.PAID) {
      throw new BadRequestException('لا يمكن تفعيل الكود، لأن الطلب المرتبط به لم يتم اعتماده كمدفوع بعد');
    }

    // التنفيذ داخل معاملة ذرية متزامنة (Atomic Prisma Transaction)
    const ipHash = clientIp
      ? crypto.createHash('sha256').update(clientIp).digest('hex')
      : null;

    let targetRedirectUrl = '/';
    let productTitle = activationRecord.order?.productTitle || 'المنتج';

    await this.prisma.$transaction(async (tx) => {
      // أ) تحديث كود التفعيل إلى مُفعل
      await tx.activationCode.update({
        where: { id: activationRecord.id },
        data: {
          status: ActivationCodeStatus.ACTIVATED,
          activationCount: { increment: 1 },
          activatedAt: new Date(),
          activatedByIpHash: ipHash,
        },
      });

      // ب) احتساب تاريخ الانتهاء حسب نوع المنتج
      let validUntil: Date | null = null;
      if (activationRecord.productType === ProductType.COMMUNITY_GROUP) {
        // اشتراك باقة جروب: 30 يوماً كافتراضي إن لم تحدد دورة الفوترة
        const plan = await tx.subscriptionPlan.findUnique({ where: { id: activationRecord.productId } });
        if (plan) {
          const days =
            plan.billingPeriod === 'ANNUAL' ? 365 :
            plan.billingPeriod === 'QUARTERLY' ? 90 :
            plan.billingPeriod === 'SEMI_ANNUAL' ? 180 :
            plan.billingPeriod === 'LIFETIME' ? null : 30;
          if (days) {
            validUntil = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
          }
        }
      }

      // ج) إنشاء سجل الاستحقاق المركزي (Entitlement)
      await tx.entitlement.upsert({
        where: {
          userId_productType_productId: {
            userId,
            productType: activationRecord.productType,
            productId: activationRecord.productId,
          },
        },
        create: {
          userId,
          productType: activationRecord.productType,
          productId: activationRecord.productId,
          orderId: activationRecord.orderId,
          activationCodeId: activationRecord.id,
          status: EntitlementStatus.ACTIVE,
          validFrom: new Date(),
          validUntil,
        },
        update: {
          status: EntitlementStatus.ACTIVE,
          orderId: activationRecord.orderId,
          activationCodeId: activationRecord.id,
          validUntil,
        },
      });

      // د) المزامنة الخلفية مع الجداول القائمة لضمان التوافقية التامة 100% (Backward Compatibility)
      if (activationRecord.productType === ProductType.RECORDED_COURSE) {
        const course = await tx.course.findUnique({ where: { id: activationRecord.productId } });
        if (course) {
          productTitle = course.title;
          targetRedirectUrl = `/courses/${course.slug}/learn`;
        }

        await tx.courseEnrollment.upsert({
          where: {
            userId_courseId: {
              userId,
              courseId: activationRecord.productId,
            },
          },
          create: {
            userId,
            courseId: activationRecord.productId,
            paidAmount: activationRecord.order?.finalAmount || 0,
            currency: activationRecord.order?.currency || 'USD',
            paymentMethod: 'ACTIVATION_CODE',
            status: 'COMPLETED',
            enrolledAt: new Date(),
            completedAt: new Date(),
          },
          update: {
            status: 'COMPLETED',
            completedAt: new Date(),
          },
        });
      } else if (activationRecord.productType === ProductType.LIVE_COURSE) {
        const session = await tx.liveSession.findUnique({ where: { id: activationRecord.productId } });
        if (session) {
          productTitle = session.title;
          targetRedirectUrl = `/live/${session.slug}`;
        }

        await tx.liveSessionAccessCode.create({
          data: {
            liveSessionId: activationRecord.productId,
            userId,
            email: user.email,
            fullName: user.fullName,
            phone: user.phoneNumber,
            accessCode: `ACC-${cleanCode.replace(/[^A-Z0-9]/g, '').slice(-8)}`,
            isPaid: true,
            paidAmount: activationRecord.order?.finalAmount || 0,
            currency: activationRecord.order?.currency || 'USD',
            source: 'ACTIVATION_CODE',
            notes: `تم التفعيل عبر كود رسمي: ${activationRecord.displayPrefix}`,
            isRevoked: false,
          },
        });
      } else if (activationRecord.productType === ProductType.COMMUNITY_GROUP) {
        const plan = await tx.subscriptionPlan.findUnique({ where: { id: activationRecord.productId } });
        if (plan) {
          productTitle = plan.name;
          targetRedirectUrl = '/dashboard/subscriptions';
        }

        await tx.userSubscription.create({
          data: {
            userId,
            planId: activationRecord.productId,
            status: 'ACTIVE',
            startDate: new Date(),
            endDate: validUntil,
            paidAmount: activationRecord.order?.finalAmount || 0,
            currency: activationRecord.order?.currency || 'USD',
            paymentMethod: 'ACTIVATION_CODE',
          },
        });
      }

      // هـ) تسجيل في سجل التدقيق
      await tx.securityAuditLog.create({
        data: {
          userId,
          action: 'CODE_ACTIVATED',
          entityType: 'ACTIVATION_CODE',
          entityId: activationRecord.id,
          ipHash,
          metadata: {
            displayPrefix: activationRecord.displayPrefix,
            productId: activationRecord.productId,
            productType: activationRecord.productType,
            productTitle,
          },
        },
      });
    });

    this.logger.log(`Code activated successfully: [${activationRecord.displayPrefix}] by user: ${user.email} (${productTitle})`);

    return {
      success: true,
      message: `تهانينا! تم تفعيل اشتراكك بنجاح في "${productTitle}". أصبح المحتوى متاحاً لك بالكامل الآن.`,
      productTitle,
      productType: activationRecord.productType,
      productId: activationRecord.productId,
      redirectUrl: targetRedirectUrl,
    };
  }

  /**
   * 3. جلب كافة التراخيص النشطة للمستخدم الحالي
   */
  async getMyEntitlements(userId: string) {
    const entitlements = await this.prisma.entitlement.findMany({
      where: {
        userId,
        status: EntitlementStatus.ACTIVE,
        OR: [
          { validUntil: null },
          { validUntil: { gt: new Date() } },
        ],
      },
      include: {
        order: { select: { orderNumber: true, productTitle: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      success: true,
      entitlements: entitlements.map((e) => ({
        id: e.id,
        productType: e.productType,
        productId: e.productId,
        productTitle: e.order?.productTitle || 'منتج معتمد',
        orderNumber: e.order?.orderNumber,
        validFrom: e.validFrom,
        validUntil: e.validUntil,
        status: e.status,
      })),
    };
  }

  /**
   * 4. فحص الصلاحية والاستحقاق المركزي (Universal Gatekeeper)
   */
  async hasValidEntitlement(userId: string, productType: ProductType, productId: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) return false;

    // الأدمن والمسؤول يمتلكان صلاحية كاملة تلقائياً
    if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
      return true;
    }

    // 1. فحص جدول الاستحقاقات المركزي
    const entitlement = await this.prisma.entitlement.findFirst({
      where: {
        userId,
        productType,
        productId,
        status: EntitlementStatus.ACTIVE,
        OR: [
          { validUntil: null },
          { validUntil: { gt: new Date() } },
        ],
      },
    });

    if (entitlement) return true;

    // 2. فحص التوافقية السابقة للكورسات المسجلة القديمة
    if (productType === ProductType.RECORDED_COURSE) {
      const enrollment = await this.prisma.courseEnrollment.findUnique({
        where: { userId_courseId: { userId, courseId: productId } },
      });
      if (enrollment && enrollment.status === 'COMPLETED') return true;
    }

    // 3. فحص التوافقية السابقة للبث المباشر القديم
    if (productType === ProductType.LIVE_COURSE) {
      const liveCode = await this.prisma.liveSessionAccessCode.findFirst({
        where: { liveSessionId: productId, userId, isRevoked: false },
      });
      if (liveCode) return true;
    }

    return false;
  }

  /**
   * نظام حظر التخمين بالقوة الغاشمة (Rate Limiting)
   */
  private checkRateLimit(key: string) {
    const now = Date.now();
    const entry = this.rateLimitMap.get(key);
    if (!entry) return;

    if (entry.blockedUntil > now) {
      const waitSeconds = Math.ceil((entry.blockedUntil - now) / 1000);
      throw new BadRequestException(
        `تم حظر محاولات التفعيل مؤقتاً لتكرار إدخال أكواد خاطئة. يرجى الانتظار لمدة ${waitSeconds} ثانية والمحاولة مجدداً.`,
      );
    }
  }

  private recordFailedAttempt(key: string) {
    const now = Date.now();
    const entry = this.rateLimitMap.get(key) || { attempts: 0, blockedUntil: 0 };
    entry.attempts += 1;

    if (entry.attempts >= 5) {
      entry.blockedUntil = now + 15 * 60 * 1000; // حظر لـ 15 دقيقة
      entry.attempts = 0;
    }

    this.rateLimitMap.set(key, entry);
  }
}
