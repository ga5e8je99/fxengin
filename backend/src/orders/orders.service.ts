import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { SubmitPaymentDto } from './dto/submit-payment.dto';
import { ProductType, OrderStatus, PaymentMethodType, EntitlementStatus } from '@prisma/client';
import { MailService } from '../mail/mail.service';
import * as crypto from 'crypto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);
  private readonly telegramBotToken: string;
  private readonly telegramFallbackToken: string;
  private readonly telegramChatId: string;
  private readonly adminDashboardUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) {
    this.telegramBotToken =
      process.env.TELEGRAM_BOT_TOKEN || '8887794694:AAFwA33_54SK4SiaVDapNpQFP_NfB9kVkXo';
    this.telegramFallbackToken = '8446714836:AAGUN--4SDnrmN2bXaiCz_rL1u39AwGRr10';
    this.telegramChatId = process.env.TELEGRAM_CHAT_ID || '5108366071';
    this.adminDashboardUrl = process.env.ADMIN_URL || 'http://186.240.145.87:3005';
  }

  /**
   * 1. إنشاء طلب جديد مع حساب السعر الحقيقي الرسمي من قاعدة البيانات وفحص الكوبون
   */
  async createOrder(userId: string | null | undefined, dto: CreateOrderDto) {
    let user: any = null;
    if (userId) {
      user = await this.prisma.user.findUnique({ where: { id: userId } });
    }

    if (!user && dto.email) {
      const normalizedEmail = dto.email.toLowerCase().trim();
      user = await this.prisma.user.findUnique({ where: { email: normalizedEmail } });
      if (!user) {
        // Auto-create student user account for guest checkout
        const randomPass = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(randomPass, salt);
        user = await this.prisma.user.create({
          data: {
            email: normalizedEmail,
            fullName: dto.fullName?.trim() || 'طالب جديد',
            phoneNumber: dto.phone?.trim() || null,
            passwordHash,
            role: 'USER',
            isActive: true,
          },
        });
      }
    }

    if (!user) {
      throw new BadRequestException('يجب تسجيل الدخول أو إدخال البريد الإلكتروني لإتمام الطلب');
    }

    let productTitle = '';
    let basePrice = 0;
    let currency = 'USD';
    let resolvedProductId = dto.productId;

    // A) كورس مسجل
    if (dto.productType === ProductType.RECORDED_COURSE) {
      const course = await this.prisma.course.findFirst({
        where: {
          OR: [{ id: dto.productId }, { slug: dto.productId }],
        },
      });
      if (!course || !course.isPublished) {
        throw new NotFoundException('الدورة التدريبية المطلوبة غير موجودة أو غير منشورة');
      }
      resolvedProductId = course.id;
      productTitle = course.title;
      basePrice = Number(course.price);
      currency = course.currency || 'USD';
    }
    // B) كورس / جلسة بث مباشر
    else if (dto.productType === ProductType.LIVE_COURSE) {
      const session = await this.prisma.liveSession.findFirst({
        where: {
          OR: [{ id: dto.productId }, { slug: dto.productId }],
        },
      });
      if (!session) {
        throw new NotFoundException('جلسة التدريب المباشر المطلوبة غير موجودة');
      }
      resolvedProductId = session.id;
      productTitle = session.title;
      basePrice = Number(session.price);
      currency = session.currency || 'USD';
    }
    // C) جروب / باقة اشتراك VIP
    else if (dto.productType === ProductType.COMMUNITY_GROUP) {
      const plan = await this.prisma.subscriptionPlan.findFirst({
        where: {
          OR: [{ id: dto.productId }, { slug: dto.productId }],
        },
      });
      if (!plan || !plan.isActive) {
        throw new NotFoundException('باقة الاشتراك المطلوبة غير موجودة أو غير نشطة');
      }
      resolvedProductId = plan.id;
      productTitle = plan.name;
      basePrice = Number(plan.price);
      currency = plan.currency || 'USD';
    } else {
      throw new BadRequestException('نوع المنتج غير مدعوم');
    }

    // 1. التحقق من عدم وجود اشتراك مفعل مسبقاً لنفس المحتوى
    const activeEntitlement = await this.prisma.entitlement.findFirst({
      where: {
        userId: user.id,
        productId: resolvedProductId,
        productType: dto.productType,
        status: EntitlementStatus.ACTIVE,
      },
    });

    if (activeEntitlement) {
      throw new BadRequestException(
        'أنت مشترك ومفعّل بالفعل في هذه الدورة التدريبية، يمكنك الوصول إليها مباشرة من حسابك دون الحاجة لإعادة الطلب.'
      );
    }

    // 2. منع تكرار الطلبات: التحقق مما إذا كان للمستخدم طلب قيد الانتظار أو قيد المراجعة لنفس المحتوى
    let existingPendingOrder = await this.prisma.order.findFirst({
      where: {
        userId: user.id,
        productId: resolvedProductId,
        productType: dto.productType,
        status: { in: [OrderStatus.PENDING, OrderStatus.UNDER_REVIEW] },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!existingPendingOrder && dto.phone && dto.phone.trim().length >= 8) {
      const cleanPhone = dto.phone.trim().replace(/[^0-9]/g, '');
      const userWithPhone = await this.prisma.user.findFirst({
        where: {
          phoneNumber: { contains: cleanPhone.slice(-8) },
        },
      });
      if (userWithPhone) {
        existingPendingOrder = await this.prisma.order.findFirst({
          where: {
            userId: userWithPhone.id,
            productId: resolvedProductId,
            productType: dto.productType,
            status: { in: [OrderStatus.PENDING, OrderStatus.UNDER_REVIEW] },
          },
          orderBy: { createdAt: 'desc' },
        });
      }
    }

    if (existingPendingOrder) {
      throw new BadRequestException(
        `لديك طلب سابق مسجل بالفعل برقم (#${existingPendingOrder.orderNumber}) وهو قيد المراجعة حالياً. لا يمكن إنشاء أكثر من طلب لنفس الخدمة حتى يتم اعتماده أو التواصل مع الدعم.`
      );
    }

    // حساب الخصم المعتمد في حال توفر كود خصم صالح
    let discountAmount = 0;
    let appliedCoupon: string | null = null;

    if (dto.couponCode) {
      const code = String(dto.couponCode).trim().toUpperCase();
      const coupon = await this.prisma.coupon.findUnique({ where: { code } });
      if (coupon && coupon.isActive) {
        const isNotExpired = !coupon.expiresAt || new Date(coupon.expiresAt) > new Date();
        const hasUsesLeft = !coupon.maxUses || coupon.usedCount < coupon.maxUses;
        if (isNotExpired && hasUsesLeft) {
          appliedCoupon = coupon.code;
          const discountVal = Number(coupon.discountValue);
          if (coupon.discountType === 'PERCENTAGE') {
            discountAmount = (basePrice * discountVal) / 100;
            if (coupon.maxDiscount && discountAmount > Number(coupon.maxDiscount)) {
              discountAmount = Number(coupon.maxDiscount);
            }
          } else {
            discountAmount = discountVal;
          }
          discountAmount = Math.min(basePrice, Math.round(discountAmount * 100) / 100);
        }
      }
    }

    const finalAmount = Math.max(0, Math.round((basePrice - discountAmount) * 100) / 100);
    const orderNumber = `FX-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;

    const order = await this.prisma.order.create({
      data: {
        orderNumber,
        userId: user.id,
        productType: dto.productType,
        productId: resolvedProductId,
        productTitle,
        basePrice,
        discountAmount,
        finalAmount,
        currency,
        couponCode: appliedCoupon,
        paymentMethod: dto.paymentMethod || PaymentMethodType.CRYPTO_USDT_TRC20,
        status: OrderStatus.PENDING,
        customerNotes: dto.customerNotes || null,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // مهلة 24 ساعة
      },
    });

    // تسجيل في سجل التدقيق الأمني
    await this.prisma.securityAuditLog.create({
      data: {
        userId: user.id,
        action: 'ORDER_CREATED',
        entityType: 'ORDER',
        entityId: order.id,
        metadata: { orderNumber: order.orderNumber, finalAmount, productTitle },
      },
    });

    this.logger.log(`Order created: ${order.orderNumber} for user ${user.email} (Amount: ${finalAmount} ${currency})`);

    // Fetch order with user relation for full notification dispatch
    const orderWithUser = await this.prisma.order.findUnique({
      where: { id: order.id },
      include: { user: true },
    });

    if (orderWithUser) {
      // 1. إرسال رسالة الـ Signal الفورية لتليجرام بكافة تفاصيل العميل وطرق الدفع
      this.sendTelegramPaymentSignal(orderWithUser).catch((err) =>
        this.logger.error(`Failed to send Telegram signal: ${err.message}`),
      );

      // 2. إرسال إشعار بريدي عبر fxengin519@gmail.com إلى جميع إيميلات الأدمن
      this.notifyAdminsByEmail(orderWithUser).catch((err) =>
        this.logger.error(`Failed to notify admins by email: ${err.message}`),
      );
    }

    return {
      success: true,
      message: 'تم إنشاء الطلب بنجاح وهو بانتظار إرسال إثبات السداد',
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        productTitle: order.productTitle,
        productType: order.productType,
        productId: order.productId,
        basePrice: Number(order.basePrice),
        discountAmount: Number(order.discountAmount),
        finalAmount: Number(order.finalAmount),
        currency: order.currency,
        paymentMethod: order.paymentMethod,
        status: order.status,
        createdAt: order.createdAt,
        expiresAt: order.expiresAt,
      },
      paymentInstructions: this.getPaymentInstructions(order.paymentMethod, finalAmount, currency),
    };
  }

  /**
   * 2. تقديم إثبات السداد وتحديث حالة الطلب إلى UNDER_REVIEW وإرسال إشعار تيليجرام تفاعلي
   */
  async submitPayment(orderId: string, userId: string | null | undefined, dto: SubmitPaymentDto) {
    const order = await this.prisma.order.findFirst({
      where: {
        OR: [{ id: orderId }, { orderNumber: orderId }],
      },
      include: { user: true },
    });

    if (!order) {
      throw new NotFoundException('الطلب غير موجود');
    }

    if (userId && order.userId !== userId) {
      throw new ForbiddenException('غير مصرح لك بتعديل هذا الطلب');
    }

    if (order.status === OrderStatus.PAID) {
      return {
        success: true,
        message: 'تم تأكيد دفع هذا الطلب واعتماده مسبقاً',
        status: order.status,
      };
    }

    if (order.status === OrderStatus.CANCELLED || order.status === OrderStatus.REFUNDED) {
      throw new BadRequestException('لا يمكن تقديم سداد لطلب ملغي أو مسترد');
    }

    const updatedOrder = await this.prisma.order.update({
      where: { id: order.id },
      data: {
        paymentMethod: dto.paymentMethod || order.paymentMethod,
        txId: dto.txId?.trim() || order.txId,
        paymentProofUrl: dto.paymentProofUrl?.trim() || order.paymentProofUrl,
        customerNotes: dto.customerNotes?.trim() || order.customerNotes,
        status: OrderStatus.UNDER_REVIEW,
      },
      include: { user: true },
    });

    // تسجيل التدقيق الأمني
    await this.prisma.securityAuditLog.create({
      data: {
        userId: userId || order.userId,
        action: 'PAYMENT_SUBMITTED',
        entityType: 'ORDER',
        entityId: order.id,
        metadata: {
          txId: dto.txId,
          proofUrl: dto.paymentProofUrl,
          method: updatedOrder.paymentMethod,
        },
      },
    });

    // إرسال إشعار فوري وتفاعلي لقناة/بوت تيليجرام الإدارة
    this.sendTelegramPaymentSignal(updatedOrder).catch((err) =>
      this.logger.error(`Failed to send Telegram payment signal: ${err.message}`),
    );

    this.logger.log(`Payment proof submitted for order: ${updatedOrder.orderNumber} (User: ${order.user.email})`);

    return {
      success: true,
      message: 'تم استلام بيانات السداد وإرسالها للإدارة المالية للتحقق والاعتماد الفوري',
      order: {
        id: updatedOrder.id,
        orderNumber: updatedOrder.orderNumber,
        status: updatedOrder.status,
        finalAmount: Number(updatedOrder.finalAmount),
        currency: updatedOrder.currency,
        txId: updatedOrder.txId,
        paymentProofUrl: updatedOrder.paymentProofUrl,
        updatedAt: updatedOrder.updatedAt,
      },
    };
  }

  /**
   * 3. جلب تفاصيل طلب محدد
   */
  async getOrderById(orderId: string, userId?: string) {
    const order = await this.prisma.order.findFirst({
      where: {
        OR: [{ id: orderId }, { orderNumber: orderId }],
      },
      include: {
        user: { select: { id: true, fullName: true, email: true, phoneNumber: true } },
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
    });

    if (!order) {
      throw new NotFoundException('الطلب غير موجود');
    }

    if (userId && order.userId !== userId) {
      throw new ForbiddenException('غير مصرح لك بعرض هذا الطلب');
    }

    return {
      success: true,
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        productTitle: order.productTitle,
        productType: order.productType,
        productId: order.productId,
        basePrice: Number(order.basePrice),
        discountAmount: Number(order.discountAmount),
        finalAmount: Number(order.finalAmount),
        currency: order.currency,
        paymentMethod: order.paymentMethod,
        status: order.status,
        txId: order.txId,
        paymentProofUrl: order.paymentProofUrl,
        customerNotes: order.customerNotes,
        adminNotes: order.adminNotes,
        paidAt: order.paidAt,
        createdAt: order.createdAt,
        expiresAt: order.expiresAt,
        user: order.user,
        activationCodes: order.activationCodes,
      },
      paymentInstructions: this.getPaymentInstructions(order.paymentMethod, Number(order.finalAmount), order.currency),
    };
  }

  /**
   * 4. جلب سجل طلبات الطالب الحالي
   */
  async getMyOrders(userId: string) {
    const orders = await this.prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        activationCodes: {
          select: {
            id: true,
            displayPrefix: true,
            status: true,
            activatedAt: true,
          },
        },
      },
    });

    return {
      success: true,
      orders: orders.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        productTitle: o.productTitle,
        productType: o.productType,
        productId: o.productId,
        finalAmount: Number(o.finalAmount),
        currency: o.currency,
        paymentMethod: o.paymentMethod,
        status: o.status,
        paidAt: o.paidAt,
        createdAt: o.createdAt,
        activationCodes: o.activationCodes,
      })),
    };
  }

  /**
   * إرسال إشعار تيليجرام منسق للـ Signal مع أزرار الإجراء السريع للإدارة
   */
  private async sendTelegramPaymentSignal(order: any) {
    const typeLabel =
      order.productType === ProductType.RECORDED_COURSE
        ? 'كورس تدريبي مسجل (Recorded Course)'
        : order.productType === ProductType.LIVE_COURSE
        ? 'كورس / بث تدريب مباشر (Live Course)'
        : 'باقة واشتراك جروبات VIP (Community Group)';

    const methodLabel = 'عملة رقمية مشفرة USDT (شبكة TRC-20)';

    const customerNotes = order.customerNotes || '';
    let telegramContact = order.user?.telegramHandle || '';
    if (!telegramContact && customerNotes.includes('تيليجرام:')) {
      const match = customerNotes.match(/تيليجرام:\s*([^\s|]+)/);
      if (match && match[1] && match[1] !== '—') telegramContact = match[1];
    }
    const cleanPhone = (order.user?.phoneNumber || '').replace(/[^0-9]/g, '');

    const telegramLink = telegramContact
      ? (telegramContact.startsWith('@') ? `https://t.me/${telegramContact.slice(1)}` : `https://t.me/${telegramContact}`)
      : cleanPhone
      ? `https://t.me/+${cleanPhone}`
      : null;

    const messageText = `<b>إشعار طلب دفع واشتراك جديد (NEW ORDER SIGNAL)</b>
━━━━━━━━━━━━━━━━━━━━
<b>رقم الطلب:</b> <code>#${order.orderNumber}</code>
<b>التاريخ:</b> ${new Date().toLocaleString('ar-EG', { timeZone: 'Africa/Cairo' })}

<b>بيانات المشترك للتفعيل:</b>
• <b>الاسم:</b> <b>${order.user?.fullName || 'مشترك جديد'}</b>
• <b>البريد:</b> <code>${order.user?.email || '—'}</code>
• <b>رقم الهاتف / واتساب:</b> <code>${order.user?.phoneNumber || '—'}</code>
• <b>معرف تيليجرام:</b> ${telegramContact ? `<code>${telegramContact}</code>` : (cleanPhone ? `<i>(تواصل برقم الهاتف: +${cleanPhone})</i>` : '—')}

<b>الخدمة / المحتوى المطلوب:</b>
• <b>المحتوى:</b> <b>${order.productTitle}</b>
• <b>النوع:</b> ${typeLabel}
• <b>المبلغ المستحق:</b> <code>${Number(order.finalAmount)} ${order.currency}</code>

<b>طريقة الدفع المختارة من العميل:</b>
• <b>${methodLabel}</b>
${order.txId ? `<b>معرف المعاملة (TxID):</b> <code>${order.txId}</code>\n` : ''}${order.paymentProofUrl ? `<b>رابط إيصال السداد:</b> <a href="${order.paymentProofUrl}">عرض الإيصال</a>\n` : ''}
<b>طريقة الدفع المعتمدة حصراً:</b>
• <b>USDT (TRC-20):</b> <code>TYDzsxdCzrG8d9V616h2UoXN589146L2f7</code>
• <i>طريقة الدفع المقبولة رسمياً هي USDT (TRC-20) فقط.</i>

<b>الحالة:</b> <b>غير مفعل (بانتظار التحقق وإصدار كود التفعيل)</b>
━━━━━━━━━━━━━━━━━━━━
<b>إجراءات فورية للإدارة:</b>`;

    const inlineKeyboard: any = {
      inline_keyboard: [
        [
          { text: 'فتح خزينة التفعيل واعتماد الكود', url: `${this.adminDashboardUrl}/dashboard/activation-codes` },
        ],
      ],
    };

    const actionRow: any[] = [];
    if (cleanPhone) {
      actionRow.push({ text: 'واتساب العميل', url: `https://wa.me/${cleanPhone}?text=${encodeURIComponent(`مرحباً ${order.user?.fullName || ''}، بخصوص طلبك #${order.orderNumber} في FXENGIN...`)}` });
    }
    if (telegramLink) {
      actionRow.push({ text: 'تيليجرام العميل', url: telegramLink });
    }
    if (actionRow.length > 0) {
      inlineKeyboard.inline_keyboard.push(actionRow);
    }

    // المحاولة بالبوت الأساسي
    let sent = false;
    try {
      const res = await fetch(`https://api.telegram.org/bot${this.telegramBotToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: this.telegramChatId,
          text: messageText,
          parse_mode: 'HTML',
          reply_markup: inlineKeyboard,
        }),
      });
      const data = await res.json();
      if (data.ok) sent = true;
    } catch (e: any) {
      this.logger.warn(`Primary Telegram send error: ${e.message}`);
    }

    // المحاولة بالبوت الاحتياطي إن فشل الأساسي
    if (!sent && this.telegramFallbackToken) {
      try {
        await fetch(`https://api.telegram.org/bot${this.telegramFallbackToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: this.telegramChatId,
            text: messageText,
            parse_mode: 'HTML',
            reply_markup: inlineKeyboard,
          }),
        });
      } catch (e2: any) {
        this.logger.error(`Fallback Telegram send error: ${e2.message}`);
      }
    }
  }

  /**
   * إرسال إشعار بريدي عبر fxengin519@gmail.com إلى جميع إيميلات الأدمن
   */
  private async notifyAdminsByEmail(order: any) {
    try {
      const admins = await this.prisma.user.findMany({
        where: { role: { in: ['ADMIN', 'SUPER_ADMIN'] } },
        select: { email: true, fullName: true },
      });

      const adminEmails = Array.from(
        new Set([
          'ga138989@gmail.com',
          'admin@fxengen.com',
          ...admins.map((a) => a.email).filter(Boolean),
        ]),
      );

      const customerNotes = order.customerNotes || '';
      let telegramHandle = order.user?.telegramHandle || undefined;
      if (!telegramHandle && customerNotes.includes('تيليجرام:')) {
        const match = customerNotes.match(/تيليجرام:\s*([^\s|]+)/);
        if (match && match[1] && match[1] !== '—') telegramHandle = match[1];
      }

      await this.mailService.sendAdminNewOrderAlert(adminEmails, {
        orderNumber: order.orderNumber,
        customerName: order.user?.fullName || 'مشترك جديد',
        customerEmail: order.user?.email || '—',
        customerPhone: order.user?.phoneNumber || '—',
        customerTelegram: telegramHandle,
        productTitle: order.productTitle,
        productType: order.productType,
        amount: Number(order.finalAmount),
        currency: order.currency,
        paymentMethod: order.paymentMethod,
        adminDashboardUrl: `${this.adminDashboardUrl}/dashboard/activation-codes`,
      });
    } catch (err: any) {
      this.logger.error(`Error in notifyAdminsByEmail: ${err.message}`);
    }
  }

  /**
   * فحص ما إذا كان للمستخدم طلب سابق قيد الانتظار أو اشتراك نشط لمنع تكرار الطلبات
   */
  async checkExistingOrderOrEntitlement(
    userId: string | null | undefined,
    productId: string,
    productType: ProductType,
    email?: string,
    phone?: string,
  ) {
    let targetUserId = userId;
    if (!targetUserId && email) {
      const u = await this.prisma.user.findUnique({
        where: { email: email.toLowerCase().trim() },
      });
      if (u) {
        targetUserId = u.id;
      }
    }

    if (!targetUserId && phone && phone.trim().length >= 8) {
      const cleanPhone = phone.trim().replace(/[^0-9]/g, '');
      const uPhone = await this.prisma.user.findFirst({
        where: { phoneNumber: { contains: cleanPhone.slice(-8) } },
      });
      if (uPhone) {
        targetUserId = uPhone.id;
      }
    }

    if (!targetUserId) {
      return { hasActiveAccess: false, hasPendingOrder: false };
    }

    // Resolve product ID if slug was passed
    let resolvedProductId = productId;
    let productTitle = '';
    if (productType === ProductType.RECORDED_COURSE) {
      const c = await this.prisma.course.findFirst({
        where: { OR: [{ id: productId }, { slug: productId }] },
      });
      if (c) {
        resolvedProductId = c.id;
        productTitle = c.title;
      }
    } else if (productType === ProductType.LIVE_COURSE) {
      const s = await this.prisma.liveSession.findFirst({
        where: { OR: [{ id: productId }, { slug: productId }] },
      });
      if (s) {
        resolvedProductId = s.id;
        productTitle = s.title;
      }
    } else if (productType === ProductType.COMMUNITY_GROUP) {
      const p = await this.prisma.subscriptionPlan.findFirst({
        where: { OR: [{ id: productId }, { slug: productId }] },
      });
      if (p) {
        resolvedProductId = p.id;
        productTitle = p.name;
      }
    }

    // 1. Check active entitlement or completed course enrollment
    const activeEntitlement = await this.prisma.entitlement.findFirst({
      where: {
        userId: targetUserId,
        productId: resolvedProductId,
        productType,
        status: EntitlementStatus.ACTIVE,
      },
    });

    if (activeEntitlement) {
      return {
        hasActiveAccess: true,
        hasPendingOrder: false,
        message: 'أنت مشترك ومفعّل بالفعل في هذه الدورة التدريبية.',
      };
    }

    if (productType === ProductType.RECORDED_COURSE) {
      const activeEnrollment = await this.prisma.courseEnrollment.findFirst({
        where: {
          userId: targetUserId,
          courseId: resolvedProductId,
          status: { in: ['COMPLETED', 'ACTIVE'] },
        },
      });

      if (activeEnrollment) {
        return {
          hasActiveAccess: true,
          hasPendingOrder: false,
          message: 'أنت مشترك ومفعّل بالفعل في هذه الدورة التدريبية.',
        };
      }
    }

    // 2. Check pending or under review order
    const pendingOrder = await this.prisma.order.findFirst({
      where: {
        userId: targetUserId,
        productId: resolvedProductId,
        productType,
        status: { in: [OrderStatus.PENDING, OrderStatus.UNDER_REVIEW] },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (pendingOrder) {
      return {
        hasActiveAccess: false,
        hasPendingOrder: true,
        order: {
          id: pendingOrder.id,
          orderNumber: pendingOrder.orderNumber,
          productTitle: pendingOrder.productTitle || productTitle,
          productType: pendingOrder.productType,
          finalAmount: Number(pendingOrder.finalAmount),
          currency: pendingOrder.currency,
          status: pendingOrder.status,
          createdAt: pendingOrder.createdAt,
          paymentMethod: pendingOrder.paymentMethod,
        },
        message: `لديك طلب سابق مسجل بالفعل برقم (#${pendingOrder.orderNumber}) وهو قيد المراجعة.`,
      };
    }

    return { hasActiveAccess: false, hasPendingOrder: false };
  }

  /**
   * إرشادات وبيانات الدفع حسب الطريقة
   */
  private getPaymentInstructions(method: PaymentMethodType, amount: number, currency: string) {
    return {
      method: PaymentMethodType.CRYPTO_USDT_TRC20,
      amount,
      currency,
      usdtWallet: {
        network: 'TRC-20 (Tron Network)',
        address: 'TYDzsxdCzrG8d9V616h2UoXN589146L2f7',
        networkFeeNotice: 'يرجى التأكد من اختيار شبكة Tron (TRC20) فقط وإرسال المبلغ الصافي بالضبط.',
      },
    };
  }
}
