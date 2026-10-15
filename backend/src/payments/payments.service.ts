import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ActivationService } from '../activation/activation.service';
import { MailService } from '../mail/mail.service';
import { OrderStatus, ActivationCodeStatus, EntitlementStatus } from '@prisma/client';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private readonly telegramBotToken: string;
  private readonly telegramChatId: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly activationService: ActivationService,
    private readonly mailService: MailService,
  ) {
    this.telegramBotToken =
      process.env.TELEGRAM_BOT_TOKEN || '8887794694:AAFwA33_54SK4SiaVDapNpQFP_NfB9kVkXo';
    this.telegramChatId = process.env.TELEGRAM_CHAT_ID || '5108366071';
  }

  /**
   * 1. جلب قائمة الطلبات للإدارة مع الفلترة والبحث
   */
  async listAdminOrders(query: {
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.status && query.status !== 'ALL') {
      where.status = query.status as OrderStatus;
    }
    if (query.search?.trim()) {
      const q = query.search.trim();
      where.OR = [
        { orderNumber: { contains: q, mode: 'insensitive' } },
        { productTitle: { contains: q, mode: 'insensitive' } },
        { txId: { contains: q, mode: 'insensitive' } },
        { user: { email: { contains: q, mode: 'insensitive' } } },
        { user: { fullName: { contains: q, mode: 'insensitive' } } },
      ];
    }

    const [total, orders] = await Promise.all([
      this.prisma.order.count({ where }),
      this.prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, fullName: true, email: true, phoneNumber: true } },
          payments: true,
          activationCodes: {
            select: {
              id: true,
              displayPrefix: true,
              status: true,
              activatedAt: true,
              createdAt: true,
            },
          },
        },
      }),
    ]);

    // حساب إحصائيات سريعة للداشبورد
    const [pendingCount, underReviewCount, paidCount, failedCount] = await Promise.all([
      this.prisma.order.count({ where: { status: OrderStatus.PENDING } }),
      this.prisma.order.count({ where: { status: OrderStatus.UNDER_REVIEW } }),
      this.prisma.order.count({ where: { status: OrderStatus.PAID } }),
      this.prisma.order.count({ where: { status: OrderStatus.FAILED } }),
    ]);

    return {
      success: true,
      data: orders,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      stats: {
        pendingCount,
        underReviewCount,
        paidCount,
        failedCount,
      },
    };
  }

  /**
   * 2. اعتماد الطلب وتأكيد السداد وتوليد كود التفعيل آلياً (Approve Payment & Issue Code)
   */
  async approveOrder(orderId: string, adminId?: string, dto?: { adminNotes?: string; transactionRef?: string }) {
    const order = await this.prisma.order.findFirst({
      where: {
        OR: [{ id: orderId }, { orderNumber: orderId }],
      },
      include: { user: true, activationCodes: true },
    });

    if (!order) {
      throw new NotFoundException('الطلب غير موجود');
    }

    // مبدأ الـ Idempotency: إذا كان مدفوعاً بالفعل ولديه كود، نرجع بياناته دون تكرار
    if (order.status === OrderStatus.PAID && order.activationCodes.length > 0) {
      return {
        success: true,
        message: 'تم اعتماد هذا الطلب مسبقاً وتوليد كود التفعيل له',
        orderNumber: order.orderNumber,
        alreadyProcessed: true,
      };
    }

    const txRef =
      dto?.transactionRef?.trim() ||
      order.txId?.trim() ||
      `TX-${order.orderNumber}-${Date.now()}`;

    // تنفيذ التعديل المالي
    const updatedOrder = await this.prisma.order.update({
      where: { id: order.id },
      data: {
        status: OrderStatus.PAID,
        paidAt: new Date(),
        adminNotes: dto?.adminNotes || order.adminNotes || 'تم التحقق من السداد والاعتماد من قبل الإدارة',
      },
    });

    // إنشاء سجل الدفع المعتمد
    await this.prisma.payment.upsert({
      where: { transactionRef: txRef },
      create: {
        orderId: order.id,
        transactionRef: txRef,
        amount: order.finalAmount,
        currency: order.currency,
        method: order.paymentMethod,
        status: 'COMPLETED',
        receiptUrl: order.paymentProofUrl,
        verifiedBy: adminId || 'MANUAL_ADMIN',
      },
      update: {
        status: 'COMPLETED',
        verifiedBy: adminId || 'MANUAL_ADMIN',
      },
    });

    // توليد كود التفعيل المشفر وإرساله عبر الإيميل للعميل
    const codeResult = await this.activationService.generateCodeForOrder(order.id, dto?.adminNotes);

    // تسجيل التدقيق الأمني
    await this.prisma.securityAuditLog.create({
      data: {
        userId: adminId,
        action: 'PAYMENT_APPROVED',
        entityType: 'ORDER',
        entityId: order.id,
        metadata: {
          orderNumber: order.orderNumber,
          buyerEmail: order.user?.email,
          displayPrefix: codeResult.displayPrefix,
        },
      },
    });

    this.logger.log(`Order ${order.orderNumber} APPROVED by ${adminId || 'Admin'}. Code: ${codeResult.displayPrefix}`);

    return {
      success: true,
      message: 'تم اعتماد السداد بنجاح وتوليد كود التفعيل وإرساله لإيميل العميل',
      orderNumber: order.orderNumber,
      orderId: order.id,
      finalAmount: Number(order.finalAmount),
      activationCode: codeResult.code, // الكود الصريح يظهر للإدارة في نافذة الاعتماد
      displayPrefix: codeResult.displayPrefix,
    };
  }

  /**
   * 3. رفض طلب السداد مع تحديد السبب وإشعار العميل (Reject Payment)
   */
  async rejectOrder(orderId: string, adminId?: string, reason?: string) {
    const order = await this.prisma.order.findFirst({
      where: {
        OR: [{ id: orderId }, { orderNumber: orderId }],
      },
      include: { user: true },
    });

    if (!order) {
      throw new NotFoundException('الطلب غير موجود');
    }

    if (order.status === OrderStatus.PAID) {
      throw new BadRequestException('لا يمكن رفض طلب تم تأكيد سداده مسبقاً، يرجى استخدام Refund بدلاً من ذلك');
    }

    const rejectionReason = reason || 'إيصال السداد غير مطابق أو لم يتم استلام التحويل في الحساب';

    await this.prisma.order.update({
      where: { id: order.id },
      data: {
        status: OrderStatus.FAILED,
        adminNotes: `تم الرفض بواسطة الإدارة. السبب: ${rejectionReason}`,
      },
    });

    // إرسال إشعار بريد رسمي للعميل بسبب الرفض
    if (order.user?.email) {
      this.mailService
        .sendPaymentRejectedEmail(
          order.user.email,
          order.user.fullName || 'المتداول',
          order.orderNumber,
          order.productTitle,
          rejectionReason,
        )
        .catch((err) => this.logger.error(`Failed to send rejection email: ${err.message}`));
    }

    // تسجيل التدقيق الأمني
    await this.prisma.securityAuditLog.create({
      data: {
        userId: adminId,
        action: 'PAYMENT_REJECTED',
        entityType: 'ORDER',
        entityId: order.id,
        metadata: { orderNumber: order.orderNumber, reason: rejectionReason },
      },
    });

    this.logger.log(`Order ${order.orderNumber} REJECTED by ${adminId || 'Admin'}. Reason: ${rejectionReason}`);

    return {
      success: true,
      message: 'تم رفض طلب السداد وتحديث الحالة وإشعار العميل بالبريد',
      orderNumber: order.orderNumber,
    };
  }

  /**
   * 4. جلب سجل أكواد التفعيل للإدارة
   */
  async listAdminActivationCodes(query: {
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 50));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.status && query.status !== 'ALL' && query.status !== 'UNACTIVATED') {
      where.status = query.status as ActivationCodeStatus;
    }
    if (query.search?.trim()) {
      const q = query.search.trim();
      where.OR = [
        { displayPrefix: { contains: q, mode: 'insensitive' } },
        { user: { email: { contains: q, mode: 'insensitive' } } },
        { user: { fullName: { contains: q, mode: 'insensitive' } } },
        { order: { orderNumber: { contains: q, mode: 'insensitive' } } },
        { order: { productTitle: { contains: q, mode: 'insensitive' } } },
      ];
    }

    // 1. جلب أكواد التفعيل المسجلة
    let codes: any[] = [];
    let totalCodes = 0;
    if (query.status !== 'UNACTIVATED') {
      [totalCodes, codes] = await Promise.all([
        this.prisma.activationCode.count({ where }),
        this.prisma.activationCode.findMany({
          where,
          skip: query.status === 'ALL' ? 0 : skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            user: { select: { id: true, fullName: true, email: true, phoneNumber: true } },
            order: {
              select: {
                id: true,
                orderNumber: true,
                productTitle: true,
                finalAmount: true,
                currency: true,
                customerNotes: true,
                paymentMethod: true,
                status: true,
              },
            },
            entitlements: true,
          },
        }),
      ]);
    }

    // 2. جلب الطلبات المعلقة التي لم يصدر لها كود تفعيل بعد (UNACTIVATED)
    let pendingOrders: any[] = [];
    if (!query.status || query.status === 'ALL' || query.status === 'UNACTIVATED' || query.status === 'UNUSED') {
      const orderWhere: any = {
        activationCodes: { none: {} },
        status: { in: [OrderStatus.PENDING, OrderStatus.UNDER_REVIEW] },
      };
      if (query.search?.trim()) {
        const q = query.search.trim();
        orderWhere.OR = [
          { orderNumber: { contains: q, mode: 'insensitive' } },
          { productTitle: { contains: q, mode: 'insensitive' } },
          { user: { email: { contains: q, mode: 'insensitive' } } },
          { user: { fullName: { contains: q, mode: 'insensitive' } } },
        ];
      }
      pendingOrders = await this.prisma.order.findMany({
        where: orderWhere,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, fullName: true, email: true, phoneNumber: true } },
        },
      });
    }

    // تحويل الطلبات المعلقة إلى هيكل العرض
    const pendingItems = pendingOrders.map((o) => {
      let phone = o.user?.phoneNumber || '';
      let telegram = '';
      if (o.customerNotes) {
        const phoneMatch = o.customerNotes.match(/هاتف:\s*([^|\n-]+)/i);
        if (phoneMatch && phoneMatch[1]) phone = phoneMatch[1].trim();
        const teleMatch = o.customerNotes.match(/تيليجرام:\s*([^|\n-]+)/i);
        if (teleMatch && teleMatch[1]) telegram = teleMatch[1].trim();
      }

      return {
        id: `pending-order-${o.id}`,
        isPendingOrder: true,
        realOrderId: o.id,
        displayPrefix: '⏳ بانتظار التفعيل',
        user: {
          id: o.user?.id,
          fullName: o.user?.fullName,
          email: o.user?.email,
          phoneNumber: phone,
          telegramHandle: telegram,
        },
        order: {
          id: o.id,
          orderNumber: o.orderNumber,
          productTitle: o.productTitle,
          finalAmount: Number(o.finalAmount),
          currency: o.currency,
          customerNotes: o.customerNotes,
          paymentMethod: o.paymentMethod,
          status: o.status,
        },
        productType: o.productType,
        status: 'UNACTIVATED',
        activationCount: 0,
        maxActivations: 1,
        activatedAt: null,
        expiresAt: o.expiresAt,
        createdAt: o.createdAt,
      };
    });

    const mappedCodes = codes.map((c) => {
      let phone = c.user?.phoneNumber || '';
      let telegram = '';
      if (c.order?.customerNotes) {
        const phoneMatch = c.order.customerNotes.match(/هاتف:\s*([^|\n-]+)/i);
        if (phoneMatch && phoneMatch[1]) phone = phoneMatch[1].trim();
        const teleMatch = c.order.customerNotes.match(/تيليجرام:\s*([^|\n-]+)/i);
        if (teleMatch && teleMatch[1]) telegram = teleMatch[1].trim();
      }

      return {
        id: c.id,
        isPendingOrder: false,
        displayPrefix: c.displayPrefix,
        user: {
          id: c.user?.id,
          fullName: c.user?.fullName,
          email: c.user?.email,
          phoneNumber: phone,
          telegramHandle: telegram,
        },
        order: c.order
          ? {
              ...c.order,
              finalAmount: Number(c.order.finalAmount),
            }
          : null,
        productType: c.productType,
        status: c.status,
        activationCount: c.activationCount,
        maxActivations: c.maxActivations,
        activatedAt: c.activatedAt,
        expiresAt: c.expiresAt,
        revokedAt: c.revokedAt,
        revocationReason: c.revocationReason,
        createdAt: c.createdAt,
      };
    });

    const allData = [...pendingItems, ...mappedCodes].sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return {
      success: true,
      data: allData,
      meta: {
        total: totalCodes + pendingOrders.length,
        page,
        limit,
        totalPages: Math.ceil((totalCodes + pendingOrders.length) / limit),
      },
      stats: {
        unactivatedCount: pendingOrders.length,
        totalCodes,
      },
    };
  }

  /**
   * 8. تفعيل طلب شراء غير مفعل وتوليد كود التفعيل مباشرة من واجهة الأكواد
   */
  async activateCodeOrOrder(id: string, adminId?: string, notes?: string) {
    if (id.startsWith('pending-order-')) {
      const orderId = id.replace('pending-order-', '');
      return this.approveOrder(orderId, adminId, { adminNotes: notes || 'تم التفعيل المباشر من خزينة أكواد التفعيل' });
    }

    const code = await this.prisma.activationCode.findUnique({
      where: { id },
      include: { order: true, user: true },
    });

    if (!code) {
      const order = await this.prisma.order.findUnique({ where: { id } });
      if (order) {
        return this.approveOrder(order.id, adminId, { adminNotes: notes });
      }
      throw new NotFoundException('السجل المطلوب تفعيله غير موجود');
    }

    if (code.status === ActivationCodeStatus.ACTIVATED) {
      return {
        success: true,
        message: 'الكود مفعل بالفعل مسبقاً',
        displayPrefix: code.displayPrefix,
        orderNumber: code.order?.orderNumber,
      };
    }

    await this.prisma.activationCode.update({
      where: { id: code.id },
      data: {
        status: ActivationCodeStatus.ACTIVATED,
        activatedAt: new Date(),
      },
    });

    return {
      success: true,
      message: 'تم تفعيل الكود بنجاح',
      displayPrefix: code.displayPrefix,
      orderNumber: code.order?.orderNumber,
    };
  }

  /**
   * 9. حذف نهائي لكود تفعيل أو طلب من قاعدة البيانات
   */
  async deleteAdminActivationCode(id: string, adminId?: string) {
    if (id.startsWith('pending-order-')) {
      const orderId = id.replace('pending-order-', '');
      return this.deleteAdminOrder(orderId, adminId);
    }

    const code = await this.prisma.activationCode.findUnique({
      where: { id },
      include: { order: true },
    });

    if (!code) {
      const order = await this.prisma.order.findUnique({ where: { id } });
      if (order) {
        return this.deleteAdminOrder(order.id, adminId);
      }
      throw new NotFoundException('سجل كود التفعيل غير موجود في قاعدة البيانات');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.entitlement.deleteMany({ where: { activationCodeId: code.id } });
      await tx.activationCode.delete({ where: { id: code.id } });
      
      await tx.securityAuditLog.create({
        data: {
          userId: adminId,
          action: 'CODE_PERMANENTLY_DELETED',
          entityType: 'ACTIVATION_CODE',
          entityId: code.id,
          metadata: { displayPrefix: code.displayPrefix, orderId: code.orderId },
        },
      });
    });

    this.logger.log(`Activation code [${code.displayPrefix}] PERMANENTLY DELETED by ${adminId || 'Admin'}`);

    return {
      success: true,
      message: 'تم حذف كود التفعيل وبياناته نهائياً من قاعدة البيانات',
    };
  }

  /**
   * 10. حذف نهائي للطلب وكافة سجلاته التابعة من قاعدة البيانات
   */
  async deleteAdminOrder(orderId: string, adminId?: string) {
    const order = await this.prisma.order.findFirst({
      where: {
        OR: [{ id: orderId }, { orderNumber: orderId }],
      },
    });

    if (!order) {
      throw new NotFoundException('الطلب غير موجود في قاعدة البيانات');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.payment.deleteMany({ where: { orderId: order.id } });
      await tx.paymentEvent.deleteMany({ where: { orderId: order.id } });
      await tx.entitlement.deleteMany({ where: { orderId: order.id } });
      await tx.activationCode.deleteMany({ where: { orderId: order.id } });
      await tx.order.delete({ where: { id: order.id } });

      await tx.securityAuditLog.create({
        data: {
          userId: adminId,
          action: 'ORDER_PERMANENTLY_DELETED',
          entityType: 'ORDER',
          entityId: order.id,
          metadata: { orderNumber: order.orderNumber, finalAmount: Number(order.finalAmount) },
        },
      });
    });

    this.logger.log(`Order #${order.orderNumber} PERMANENTLY DELETED by ${adminId || 'Admin'}`);

    return {
      success: true,
      message: `تم حذف الطلب #${order.orderNumber} وكافة بياناته نهائياً من قاعدة البيانات`,
    };
  }

  /**
   * 5. إلغاء كود تفعيل وتعطيل أي ترخيص مشتق منه (Revoke Activation Code)
   */
  async revokeActivationCode(codeId: string, adminId?: string, reason?: string) {
    const code = await this.prisma.activationCode.findUnique({
      where: { id: codeId },
      include: { entitlements: true, order: true },
    });

    if (!code) {
      throw new NotFoundException('كود التفعيل غير موجود');
    }

    const revocationReason = reason || 'تم إلغاء الكود بواسطة الإدارة المالية';

    await this.prisma.$transaction(async (tx) => {
      // تحديث حالة الكود
      await tx.activationCode.update({
        where: { id: code.id },
        data: {
          status: ActivationCodeStatus.REVOKED,
          revokedAt: new Date(),
          revocationReason,
        },
      });

      // تعطيل كافة الاستحقاقات المشتقة
      await tx.entitlement.updateMany({
        where: { activationCodeId: code.id },
        data: { status: EntitlementStatus.REVOKED },
      });

      // إلغاء أي تسجيلات كورس نشطة مشتقة من هذا الكود
      if (Array.isArray(code.entitlements)) {
        for (const ent of code.entitlements) {
          if (ent.productType === 'RECORDED_COURSE') {
            await tx.courseEnrollment.updateMany({
              where: {
                userId: ent.userId,
                courseId: ent.productId,
              },
              data: { status: 'REVOKED' },
            });
          } else if (ent.productType === 'LIVE_COURSE') {
            await tx.liveSessionAccessCode.updateMany({
              where: {
                userId: ent.userId,
                liveSessionId: ent.productId,
              },
              data: { isRevoked: true },
            });
          }
        }
      }

      // تسجيل التدقيق
      await tx.securityAuditLog.create({
        data: {
          userId: adminId,
          action: 'CODE_REVOKED',
          entityType: 'ACTIVATION_CODE',
          entityId: code.id,
          metadata: { displayPrefix: code.displayPrefix, reason: revocationReason },
        },
      });
    });

    this.logger.log(`Activation code [${code.displayPrefix}] REVOKED by ${adminId || 'Admin'}`);

    return {
      success: true,
      message: 'تم إلغاء صلاحية كود التفعيل وتعطيل الاستحقاقات المشتقة منه بنجاح',
      displayPrefix: code.displayPrefix,
    };
  }

  /**
   * 6. إعادة توليد كود جديد للمستخدم وإبطال القديم (Regenerate Activation Code)
   */
  async regenerateActivationCode(codeId: string, adminId?: string, notes?: string) {
    const oldCode = await this.prisma.activationCode.findUnique({
      where: { id: codeId },
      include: { order: true },
    });

    if (!oldCode) {
      throw new NotFoundException('كود التفعيل غير موجود');
    }

    // إبطال الكود القديم
    await this.revokeActivationCode(oldCode.id, adminId, 'تم استبداله بكود تفعيل جديد');

    // توليد كود جديد
    const newCodeResult = await this.activationService.generateCodeForOrder(
      oldCode.orderId,
      notes || 'إعادة إصدار كود جديد بواسطة الإدارة',
    );

    return {
      success: true,
      message: 'تم إبطال الكود القديم وتوليد كود تفعيل جديد وإرساله للعميل بنجاح',
      oldDisplayPrefix: oldCode.displayPrefix,
      newCode: newCodeResult.code,
      newDisplayPrefix: newCodeResult.displayPrefix,
    };
  }

  /**
   * 7. معالجة Webhook إشارات ونقرات أزرار التيليجرام (Telegram Callback Query)
   */
  async handleTelegramCallbackQuery(callbackQuery: any) {
    const data = callbackQuery?.data; // e.g. "pay:approve:ORDER_ID" or "pay:reject:ORDER_ID"
    const fromId = String(callbackQuery?.from?.id);
    const callbackQueryId = callbackQuery?.id;
    const messageId = callbackQuery?.message?.message_id;
    const chatId = callbackQuery?.message?.chat?.id;

    // التأكد من أن المنفذ هو المشرف المعتمد
    if (fromId !== this.telegramChatId) {
      this.logger.warn(`Unauthorized telegram callback query attempt from ID: ${fromId}`);
      return { success: false, error: 'Unauthorized Telegram Sender' };
    }

    if (!data || !data.startsWith('pay:')) {
      return { success: false, error: 'Unknown callback action' };
    }

    const parts = data.split(':');
    const action = parts[1]; // 'approve' or 'reject'
    const orderId = parts[2];

    try {
      if (action === 'approve') {
        const res = await this.approveOrder(orderId, `TG_ADMIN_${fromId}`, {
          adminNotes: 'تم الاعتماد عبر زر تيليجرام التفاعلي',
        });

        // تحديث رسالة التيليجرام الأصلية لبيان حالة الاعتماد ومنع الضغط المزدوج
        await this.editTelegramMessage(
          chatId,
          messageId,
          `✅ <b>تم اعتماد الطلب وتوليد كود التفعيل بنجاح!</b>\n\n📋 رقم الطلب: <code>${res.orderNumber}</code>\n🔑 كود التفعيل: <code>${res.activationCode}</code>\n👤 تم إرسال الكود لإيميل العميل المسجل.`,
        );

        await this.answerTelegramCallback(callbackQueryId, '✅ تم اعتماد الطلب وتوليد الكود بنجاح!');
        return { success: true, action: 'approved', orderId };
      } else if (action === 'reject') {
        await this.rejectOrder(orderId, `TG_ADMIN_${fromId}`, 'تم الرفض مباشرة من قبل الإدارة عبر تيليجرام');

        await this.editTelegramMessage(
          chatId,
          messageId,
          `❌ <b>تم رفض طلب السداد</b>\n\nالمعرف: <code>${orderId}</code>\nتم إشعار العميل بالبريد لمراجعة الدعم.`,
        );

        await this.answerTelegramCallback(callbackQueryId, '❌ تم رفض الطلب');
        return { success: true, action: 'rejected', orderId };
      }
    } catch (err: any) {
      this.logger.error(`Error processing telegram callback: ${err.message}`);
      await this.answerTelegramCallback(callbackQueryId, `خطأ: ${err.message}`);
      return { success: false, error: err.message };
    }
  }

  private async answerTelegramCallback(callbackQueryId: string, text: string) {
    try {
      await fetch(`https://api.telegram.org/bot${this.telegramBotToken}/answerCallbackQuery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ callback_query_id: callbackQueryId, text }),
      });
    } catch {}
  }

  private async editTelegramMessage(chatId: string | number, messageId: number, text: string) {
    try {
      await fetch(`https://api.telegram.org/bot${this.telegramBotToken}/editMessageText`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          message_id: messageId,
          text,
          parse_mode: 'HTML',
          reply_markup: { inline_keyboard: [] }, // إزالة الأزرار لمنع النقر المتكرر
        }),
      });
    } catch {}
  }
}
