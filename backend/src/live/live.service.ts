import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
  Inject,
  forwardRef,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../common/services/redis.service';
import { LiveGateway } from './live.gateway';
import { CreateLiveSessionDto } from './dto/create-live-session.dto';
import { UpdateLiveSessionDto } from './dto/update-live-session.dto';
import {
  CreateManualAccessCodeDto,
  VerifyAccessCodeDto,
  LiveCourseCheckoutDto,
} from './dto/access-code.dto';
import { LiveSessionStatus, CourseAccessTier } from '@prisma/client';
import { Subject, Observable } from 'rxjs';
import { MailService } from '../mail/mail.service';

export interface ChatMessagePayload {
  id: string;
  sessionId: string;
  userId: string;
  senderName: string;
  message: string;
  isModerator: boolean;
  isPinned: boolean;
  createdAt: string;
}

@Injectable()
export class LiveService {
  private readonly logger = new Logger(LiveService.name);
  private readonly ticketSecret =
    process.env.JWT_SECRET || 'fxengin_live_vault_secret_2026_institutional_grade!';
  // Real-time SSE Subjects per live session ID
  private readonly chatStreams: Map<string, Subject<{ data: ChatMessagePayload | any }>> = new Map();

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    @Inject(forwardRef(() => LiveGateway))
    private readonly liveGateway: LiveGateway,
    private readonly mailService: MailService,
  ) {}

  /**
   * التحقق المباشر مما إذا كان المتداول يملك صلاحية تقنية معينة عبر باقاته النشطة
   */
  private async hasUserPermission(userId: string | null | undefined, permissionKey: string): Promise<boolean> {
    if (!userId) return false;
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        subscriptions: {
          where: {
            status: 'ACTIVE',
            OR: [{ endDate: null }, { endDate: { gt: new Date() } }],
          },
          include: { plan: true },
        },
      },
    });

    if (!user) return false;
    if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') return true;

    for (const sub of user.subscriptions) {
      const perms = Array.isArray(sub.plan.permissions) ? (sub.plan.permissions as string[]) : [];
      if (perms.includes(permissionKey)) return true;
    }

    if (user.role === 'VIP') return true;

    return false;
  }


  /**
   * جلب دليل جلسات البث المباشر (المباشر الآن، القادمة المجدولة، والتسجيلات)
   */
  async listPublicSessions() {
    const allSessions = await this.prisma.liveSession.findMany({
      where: {
        status: { in: [LiveSessionStatus.LIVE, LiveSessionStatus.SCHEDULED, LiveSessionStatus.ENDED] },
      },
      orderBy: { scheduledStartTime: 'asc' },
      include: {
        _count: {
          select: { messages: true },
        },
      },
    });

    const liveNow = allSessions.filter((s) => s.status === LiveSessionStatus.LIVE);
    const upcoming = allSessions.filter((s) => s.status === LiveSessionStatus.SCHEDULED);
    const replays = allSessions
      .filter((s) => s.status === LiveSessionStatus.ENDED && s.isRecordingAvailable)
      .sort((a, b) => b.scheduledStartTime.getTime() - a.scheduledStartTime.getTime());

    return {
      liveNow: liveNow.map(this.formatSessionSummary),
      upcoming: upcoming.map(this.formatSessionSummary),
      replays: replays.map(this.formatSessionSummary),
      totalActiveCount: liveNow.length,
      totalUpcomingCount: upcoming.length,
    };
  }

  /**
   * دالة معالجة واستخراج معرّف الجلسة أو الرابط سواء كان مشفراً برمجياً أو عربياً خالصاً
   */
  private resolveSessionQuery(idOrSlug: string) {
    let decoded = idOrSlug.trim();
    try {
      decoded = decodeURIComponent(idOrSlug);
      if (decoded.includes('%')) {
        decoded = decodeURIComponent(decoded);
      }
    } catch {}

    const trimmed = idOrSlug.trim();
    const cleanDecoded = decoded.trim();

    return {
      OR: [
        { id: trimmed },
        { slug: trimmed },
        { id: cleanDecoded },
        { slug: cleanDecoded },
      ],
    };
  }

  /**
   * جلب بيانات التايمر الدقيقة لجلسة معينة أو للبث القادم الأقرب (مع مزامنة توقيت السيرفر اللحظي)
   */
  async getLiveTimer(idOrSlug?: string) {
    let session: any = null;

    if (idOrSlug) {
      session = await this.prisma.liveSession.findFirst({
        where: this.resolveSessionQuery(idOrSlug),
      });
      if (!session) {
        throw new NotFoundException('جلسة البث المباشر غير موجودة');
      }
    } else {
      // 1. تحقق أولاً مما إذا كان هناك بث مباشر جارٍ حالياً
      session = await this.prisma.liveSession.findFirst({
        where: { status: LiveSessionStatus.LIVE },
        orderBy: { actualStartTime: 'desc' },
      });

      // 2. إذا لم يكن هناك بث مباشر الآن، ابحث عن أقرب جلسة مجدولة قادمة
      if (!session) {
        session = await this.prisma.liveSession.findFirst({
          where: {
            status: LiveSessionStatus.SCHEDULED,
          },
          orderBy: { scheduledStartTime: 'asc' },
        });
      }
    }

    if (!session) {
      return {
        hasActiveOrUpcoming: false,
        message: 'لا توجد جلسات بث مباشر نشطة أو مجدولة حالياً',
        serverTime: new Date().toISOString(),
      };
    }

    const now = Date.now();
    const scheduledTime = new Date(session.scheduledStartTime).getTime();
    const remainingSeconds = Math.max(0, Math.floor((scheduledTime - now) / 1000));

    const days = Math.floor(remainingSeconds / (3600 * 24));
    const hours = Math.floor((remainingSeconds % (3600 * 24)) / 3600);
    const minutes = Math.floor((remainingSeconds % 3600) / 60);
    const seconds = remainingSeconds % 60;

    return {
      hasActiveOrUpcoming: true,
      sessionId: session.id,
      slug: session.slug,
      title: session.title,
      description: session.description,
      instructorName: session.instructorName,
      coverImage: session.coverImage,
      status: session.status,
      isLiveNow: session.status === LiveSessionStatus.LIVE,
      minTier: session.minTier,
      isFree: session.isFree,
      scheduledStartTime: session.scheduledStartTime.toISOString(),
      serverTime: new Date().toISOString(),
      remainingSeconds,
      countdown: {
        days,
        hours,
        minutes,
        seconds,
      },
    };
  }

  /**
   * تحديد وتحديث توقيت التايمر وجدولته من استوديو الأدمن مع البث الفوري عبر SSE
   */
  async updateLiveTimer(id: string, newStartTime: Date) {
    const session = await this.prisma.liveSession.findUnique({ where: { id } });
    if (!session) {
      throw new NotFoundException('جلسة البث المباشر غير موجودة');
    }

    const updated = await this.prisma.liveSession.update({
      where: { id },
      data: {
        scheduledStartTime: newStartTime,
        ...(session.status !== LiveSessionStatus.LIVE && {
          status: LiveSessionStatus.SCHEDULED,
        }),
      },
    });

    const now = Date.now();
    const scheduledTime = new Date(updated.scheduledStartTime).getTime();
    const remainingSeconds = Math.max(0, Math.floor((scheduledTime - now) / 1000));

    const payload = {
      type: 'TIMER_UPDATED',
      sessionId: updated.id,
      scheduledStartTime: updated.scheduledStartTime.toISOString(),
      serverTime: new Date().toISOString(),
      remainingSeconds,
      status: updated.status,
    };

    // بث تحديث التايمر لحظياً لكافة الحضور المتصلين بالغرفة
    this.broadcastToSession(id, payload);

    this.logger.log(`Live timer updated for session ${id} to ${newStartTime.toISOString()}`);

    return {
      success: true,
      message: 'تم تحديث توقيت البث المباشر وجدولته بنجاح!',
      session: updated,
      remainingSeconds,
      serverTime: new Date().toISOString(),
    };
  }

  /**
   * جلب تفاصيل غرفة البث والتحقق من أهلية الحضور وتوفير بيانات العلامة المائية
   */
  async getSessionRoom(idOrSlug: string, userId?: string, clientIp?: string, accessCode?: string) {
    const session = await this.prisma.liveSession.findFirst({
      where: this.resolveSessionQuery(idOrSlug),
      include: {
        _count: {
          select: { messages: true, accessCodes: true },
        },
      },
    });

    if (!session) {
      throw new NotFoundException('جلسة البث المباشر غير موجودة');
    }

    let user: any = null;
    let canAccess = false;
    let accessDeniedReason: string | null = null;
    let matchedAccessCode: any = null;

    if (userId) {
      user = await this.prisma.user.findUnique({ where: { id: userId } });
    }

    // التحقق من متطلبات الوصول للبث
    const sessionPrice = Number(session.price) || 0;
    const isFree = (session.isFree || sessionPrice <= 0) && session.minTier === CourseAccessTier.FREE;

    // Super Admin, Admin, and VIP always have full clearance
    if (user && ['SUPER_ADMIN', 'ADMIN', 'VIP'].includes(user.role)) {
      canAccess = true;
    } else if (isFree) {
      // Free live sessions are accessible to all members and visitors
      canAccess = true;
    } else {
      // 1. فحص كود الدخول المدخل صراحة
      if (accessCode && typeof accessCode === 'string' && accessCode.trim()) {
        const cleanCode = accessCode.trim().toUpperCase();
        matchedAccessCode = await this.prisma.liveSessionAccessCode.findFirst({
          where: {
            liveSessionId: session.id,
            accessCode: cleanCode,
            isRevoked: false,
          },
        });

        if (matchedAccessCode) {
          canAccess = true;
          // تحديث وقت الاستخدام وربط المستخدم إذا توفر
          await this.prisma.liveSessionAccessCode.update({
            where: { id: matchedAccessCode.id },
            data: {
              lastUsedAt: new Date(),
              usageCount: { increment: 1 },
              ...(userId && !matchedAccessCode.userId ? { userId } : {}),
            },
          }).catch(() => {});
        }
      }

      // 2. إذا لم يدخل كود، فحص إذا كان للمستخدم المسجل كود صالح مُسبقاً (بالمعرف أو بالبريد الإلكتروني)
      if (!canAccess && (userId || user?.email)) {
        matchedAccessCode = await this.prisma.liveSessionAccessCode.findFirst({
          where: {
            liveSessionId: session.id,
            OR: [
              ...(userId ? [{ userId }] : []),
              ...(user?.email ? [{ email: user.email.toLowerCase().trim() }] : []),
            ],
            isRevoked: false,
          },
          orderBy: { createdAt: 'desc' },
        });
        if (matchedAccessCode) {
          canAccess = true;
          if (userId && !matchedAccessCode.userId) {
            await this.prisma.liveSessionAccessCode.update({
              where: { id: matchedAccessCode.id },
              data: { userId },
            }).catch(() => {});
          }
        }
      }

      // 3. فحص اشتراك VIP العام
      if (!canAccess && user) {
        const hasLiveAccess = await this.hasUserPermission(user.id, 'LIVE_STREAMING_ACCESS');
        if (hasLiveAccess) {
          canAccess = true;
        }
      }

      // 4. تحديد سبب المنع لعرض الواجهة المناسبة (دفع / كود / تسجيل دخول)
      if (!canAccess) {
        if (sessionPrice > 0) {
          accessDeniedReason = 'PAYMENT_OR_CODE_REQUIRED';
        } else if (!user) {
          accessDeniedReason = 'LOGIN_REQUIRED';
        } else {
          accessDeniedReason = 'VIP_SUBSCRIPTION_REQUIRED';
        }
      }
    }

    // ضمان وجود مفتاح بث مشفر للجلسة دائماً
    if (!session.streamKey) {
      const autoKey = `fx_live_${session.id.slice(-6)}_${crypto.randomBytes(6).toString('hex')}`;
      const defaultUrl = `https://live.fxengen.com/live/${autoKey}.m3u8`;
      await this.prisma.liveSession.update({
        where: { id: session.id },
        data: {
          streamKey: autoKey,
          streamUrl: session.streamUrl || defaultUrl,
          streamType: session.streamType === 'HLS' ? 'SRS_SOVEREIGN' : session.streamType,
        },
      });
      session.streamKey = autoKey;
      if (!session.streamUrl) session.streamUrl = defaultUrl;
    }

    const sessionHash = crypto
      .createHash('sha256')
      .update(`${user?.id || 'guest'}:${session.id}:${Date.now()}`)
      .digest('hex')
      .slice(0, 12);

    const watermark = user
      ? {
          userName: user.fullName,
          userEmail: user.email,
          userId: user.id,
          clientIp: clientIp || '186.240.xxx.xxx',
          sessionHash,
          issuedAt: new Date().toISOString(),
        }
      : null;

    const playbackEndpoints = canAccess
      ? {
          webrtcUrl: `https://live.fxengen.com/rtc/v1/play/?app=live&stream=${session.streamKey}`,
          hlsUrl: `https://live.fxengen.com/live/${session.streamKey}.m3u8`,
          flvUrl: `https://live.fxengen.com/live/${session.streamKey}.flv`,
          replayUrl: session.isRecordingAvailable ? session.replayUrl : null,
        }
      : null;

    return {
      session: {
        id: session.id,
        slug: session.slug,
        title: session.title,
        description: session.description,
        coverImage: session.coverImage,
        streamType: session.streamType,
        streamKey: canAccess ? session.streamKey : null,
        // إخفاء رابط البث الفعلي إن لم يكن مسموحاً للمستخدم بالدخول
        streamUrl: canAccess ? session.streamUrl : null,
        playbackEndpoints,
        status: session.status,
        scheduledStartTime: session.scheduledStartTime,
        scheduledEndTime: session.scheduledEndTime,
        actualStartTime: session.actualStartTime,
        actualEndTime: session.actualEndTime,
        minTier: session.minTier,
        isFree: session.isFree,
        price: Number(session.price) || 0,
        currency: session.currency || 'USD',
        instructorName: session.instructorName,
        maxParticipants: session.maxParticipants,
        isRecordingAvailable: session.isRecordingAvailable,
        replayUrl: canAccess && session.isRecordingAvailable ? session.replayUrl : null,
        totalMessagesCount: session._count.messages,
        totalEnrolledCount: session._count.accessCodes,
      },
      canAccess,
      accessDeniedReason,
      watermark,
      hasMatchedAccessCode: Boolean(matchedAccessCode),
      matchedAccessCode: matchedAccessCode ? matchedAccessCode.accessCode : null,
    };
  }

  /**
   * جلب أرشيف الرسائل السابقة لغرفة الشات
   */
  async getChatHistory(sessionId: string, limit = 50) {
    const messages = await this.prisma.liveChatMessage.findMany({
      where: { liveSessionId: sessionId },
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { id: true, fullName: true, role: true },
        },
      },
    });

    return messages.reverse().map((m) => ({
      id: m.id,
      sessionId: m.liveSessionId,
      userId: m.userId,
      senderName: m.senderName,
      message: m.message,
      isModerator: m.isModerator,
      isPinned: m.isPinned,
      createdAt: m.createdAt.toISOString(),
      userRole: m.user?.role,
    }));
  }

  /**
   * إرسال رسالة شات تفاعلية لحظية وبثها لكافة الحضور المتصلين عبر SSE
   */
  async sendChatMessage(sessionId: string, userId: string, messageText: string): Promise<ChatMessagePayload> {
    const session = await this.prisma.liveSession.findUnique({ where: { id: sessionId } });
    if (!session) {
      throw new NotFoundException('جلسة البث غير موجودة');
    }

    if (session.status === LiveSessionStatus.ENDED || session.status === LiveSessionStatus.CANCELLED) {
      throw new BadRequestException('تم إغلاق الدردشة المباشرة لانتهاء البث');
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('المستخدم غير موجود');
    }

    const isModerator = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';
    const isFreeSession = session.isFree || session.minTier === CourseAccessTier.FREE;
    let hasChatPrivilege = isModerator || isFreeSession;

    if (!hasChatPrivilege) {
      hasChatPrivilege = await this.hasUserPermission(userId, 'LIVE_CHAT_PRIVILEGE');
    }

    if (!isModerator && !hasChatPrivilege) {
      throw new ForbiddenException('المشاركة في الشات المباشر تتطلب باقة تتضمن صلاحية الدردشة التفاعلية');
    }

    const cleanText = messageText.trim();
    if (!cleanText) {
      throw new BadRequestException('لا يمكن إرسال رسالة فارغة');
    }

    const senderName = user.fullName || 'عضو المنصة';

    // Prevent rapid duplicate insertion within 2 seconds
    const recentDuplicate = await this.prisma.liveChatMessage.findFirst({
      where: {
        liveSessionId: sessionId,
        message: cleanText,
        createdAt: {
          gte: new Date(Date.now() - 2000),
        },
      },
    });

    if (recentDuplicate) {
      return {
        id: recentDuplicate.id,
        sessionId,
        userId,
        senderName: recentDuplicate.senderName,
        message: recentDuplicate.message,
        isModerator: recentDuplicate.isModerator,
        isPinned: recentDuplicate.isPinned,
        createdAt: recentDuplicate.createdAt.toISOString(),
      };
    }

    const created = await this.prisma.liveChatMessage.create({
      data: {
        liveSessionId: sessionId,
        userId,
        senderName,
        message: cleanText,
        isModerator,
      },
    });

    const payload: ChatMessagePayload = {
      id: created.id,
      sessionId,
      userId,
      senderName: created.senderName,
      message: created.message,
      isModerator: created.isModerator,
      isPinned: created.isPinned,
      createdAt: created.createdAt.toISOString(),
    };

    // بث الرسالة الفورية عبر مجرى SSE للغرفة
    this.broadcastToSession(sessionId, { type: 'CHAT_MESSAGE', ...payload });
    try {
      this.liveGateway.broadcastChatMessage(sessionId, {
        id: created.id,
        sessionId,
        userId,
        senderName: created.senderName,
        message: created.message,
        userRole: isModerator ? 'INSTRUCTOR' : 'TRADER',
        isModerator,
        isPinned: created.isPinned,
        createdAt: created.createdAt.toISOString(),
      });
    } catch (e) {}

    return payload;
  }

  /**
   * الاشتراك في قناة تدفق أحداث الشات المباشر عبر Server-Sent Events (SSE)
   */
  getChatStream(sessionId: string): Observable<{ data: any }> {
    if (!this.chatStreams.has(sessionId)) {
      this.chatStreams.set(sessionId, new Subject<{ data: any }>());
    }
    return this.chatStreams.get(sessionId)!.asObservable();
  }

  private broadcastToSession(sessionId: string, data: any) {
    const stream = this.chatStreams.get(sessionId);
    if (stream) {
      stream.next({ data });
    }
  }

  // ===================== لوحة تحكم الإدارة للبث المباشر (Admin Live Control) =====================

  async createLiveSession(dto: CreateLiveSessionDto) {
    const generatedSlug =
      dto.slug?.trim() ||
      dto.title
        .toLowerCase()
        .replace(/[^\w\u0621-\u064A]+/g, '-')
        .replace(/^-+|-+$/g, '') +
        '-' +
        Date.now().toString().slice(-4);

    const existing = await this.prisma.liveSession.findUnique({ where: { slug: generatedSlug } });
    if (existing) {
      throw new BadRequestException('الاسم الرابطي (Slug) مستخدم بالفعل، يرجى اختيار اسم آخر.');
    }

    const generatedStreamKey =
      dto.streamKey?.trim() || `fx_live_${crypto.randomBytes(8).toString('hex')}`;

    const defaultStreamUrl =
      dto.streamUrl?.trim() || `https://live.fxengen.com/live/${generatedStreamKey}.m3u8`;

    const isFreeComputed =
      dto.isFree !== undefined
        ? dto.isFree
        : (dto.isPaidCourse !== undefined ? !dto.isPaidCourse : (dto.price && Number(dto.price) > 0 ? false : true));

    const session = await this.prisma.liveSession.create({
      data: {
        title: dto.title,
        slug: generatedSlug,
        description: dto.description,
        coverImage: dto.coverImage,
        streamUrl: defaultStreamUrl,
        streamType: dto.streamType || 'SRS_SOVEREIGN',
        streamKey: generatedStreamKey,
        scheduledStartTime: new Date(dto.scheduledStartTime),
        scheduledEndTime: dto.scheduledEndTime ? new Date(dto.scheduledEndTime) : null,
        minTier: dto.minTier || CourseAccessTier.FREE,
        isFree: isFreeComputed,
        price: dto.price !== undefined ? dto.price : 0,
        currency: dto.currency || 'USD',
        instructorName: dto.instructorName || 'FxEngin Market Analyst',
        maxParticipants: dto.maxParticipants || 500,
        status: LiveSessionStatus.SCHEDULED,
      },
    });

    this.logger.log(`Created new sovereign live session: "${session.title}" (ID: ${session.id}) with StreamKey: ${generatedStreamKey}`);
    return session;
  }

  async updateLiveSession(id: string, dto: UpdateLiveSessionDto) {
    const session = await this.prisma.liveSession.findUnique({ where: { id } });
    if (!session) {
      throw new NotFoundException('جلسة البث غير موجودة');
    }

    const updated = await this.prisma.liveSession.update({
      where: { id },
      data: {
        ...(dto.title && { title: dto.title }),
        ...(dto.slug && { slug: dto.slug }),
        ...(dto.description && { description: dto.description }),
        ...(dto.coverImage !== undefined && { coverImage: dto.coverImage }),
        ...(dto.streamUrl !== undefined && { streamUrl: dto.streamUrl }),
        ...(dto.streamType && { streamType: dto.streamType }),
        ...(dto.streamKey !== undefined && { streamKey: dto.streamKey }),
        ...(dto.scheduledStartTime && { scheduledStartTime: new Date(dto.scheduledStartTime) }),
        ...(dto.scheduledEndTime !== undefined && {
          scheduledEndTime: dto.scheduledEndTime ? new Date(dto.scheduledEndTime) : null,
        }),
        ...(dto.minTier && { minTier: dto.minTier }),
        ...(dto.isFree !== undefined && { isFree: dto.isFree }),
        ...(dto.price !== undefined && { price: dto.price }),
        ...(dto.currency && { currency: dto.currency }),
        ...(dto.instructorName && { instructorName: dto.instructorName }),
        ...(dto.maxParticipants && { maxParticipants: dto.maxParticipants }),
        ...(dto.status && { status: dto.status }),
        ...(dto.isRecordingAvailable !== undefined && { isRecordingAvailable: dto.isRecordingAvailable }),
        ...(dto.replayUrl !== undefined && { replayUrl: dto.replayUrl }),
      },
    });

    // إشعار المتصلين بالتحديث
    this.broadcastToSession(id, { type: 'SESSION_UPDATED', status: updated.status });

    return updated;
  }

  async setSessionStatus(id: string, status: LiveSessionStatus) {
    const session = await this.prisma.liveSession.findUnique({ where: { id } });
    if (!session) {
      throw new NotFoundException('جلسة البث غير موجودة');
    }

    const data: any = { status };
    if (status === LiveSessionStatus.LIVE && !session.actualStartTime) {
      data.actualStartTime = new Date();
    }
    if (status === LiveSessionStatus.ENDED && !session.actualEndTime) {
      data.actualEndTime = new Date();
    }

    const updated = await this.prisma.liveSession.update({
      where: { id },
      data,
    });

    this.logger.log(`Live session ${id} status changed to ${status}`);
    this.broadcastToSession(id, { type: 'STATUS_CHANGED', status, actualStartTime: updated.actualStartTime });

    return {
      success: true,
      message: `تم تغيير حالة البث إلى: ${status}`,
      session: updated,
    };
  }

  async deleteLiveSession(id: string) {
    const session = await this.prisma.liveSession.findUnique({ where: { id } });
    if (!session) {
      throw new NotFoundException('جلسة البث غير موجودة');
    }

    await this.prisma.liveSession.delete({ where: { id } });
    this.chatStreams.delete(id);

    return { success: true, message: 'تم حذف جلسة البث المباشر بنجاح' };
  }

  async pinChatMessage(messageId: string, isPinned: boolean) {
    const message = await this.prisma.liveChatMessage.findUnique({ where: { id: messageId } });
    if (!message) {
      throw new NotFoundException('الرسالة غير موجودة');
    }

    const updated = await this.prisma.liveChatMessage.update({
      where: { id: messageId },
      data: { isPinned },
    });

    this.broadcastToSession(message.liveSessionId, {
      type: 'MESSAGE_PIN_TOGGLED',
      messageId,
      isPinned,
      messageText: message.message,
      senderName: message.senderName,
    });
    try {
      this.liveGateway.broadcastPinMessage(message.liveSessionId, messageId, isPinned);
    } catch (e) {}

    return updated;
  }

  async deleteChatMessage(messageId: string) {
    const message = await this.prisma.liveChatMessage.findUnique({ where: { id: messageId } });
    if (!message) {
      throw new NotFoundException('الرسالة غير موجودة');
    }

    await this.prisma.liveChatMessage.delete({ where: { id: messageId } });

    this.broadcastToSession(message.liveSessionId, {
      type: 'MESSAGE_DELETED',
      messageId,
    });
    try {
      this.liveGateway.broadcastDeleteMessage(message.liveSessionId, messageId);
    } catch (e) {}

    return { success: true, message: 'تم حذف الرسالة بنجاح' };
  }

  async listAllAdminSessions() {
    const sessions = await this.prisma.liveSession.findMany({
      orderBy: { scheduledStartTime: 'desc' },
      include: {
        _count: {
          select: { messages: true, accessCodes: true },
        },
      },
    });

    return sessions.map((s) => ({
      ...s,
      accessCodesCount: s._count?.accessCodes || 0,
      totalEnrolledCount: s._count?.accessCodes || 0,
      messagesCount: s._count?.messages || 0,
    }));
  }

  // ===================== خادم الوسائط السيادي والمصادقة (Sovereign Ingest & Media Server) =====================

  /**
   * جلب بيانات اتصال وبث OBS Studio / vMix المشفرة والخاصة بالسيرفر
   */
  async getStreamCredentials(id: string) {
    const session = await this.prisma.liveSession.findUnique({ where: { id } });
    if (!session) {
      throw new NotFoundException('جلسة البث غير موجودة');
    }

    let streamKey = session.streamKey;
    if (!streamKey) {
      streamKey = `fx_live_${session.id.slice(-6)}_${crypto.randomBytes(6).toString('hex')}`;
      await this.prisma.liveSession.update({
        where: { id: session.id },
        data: {
          streamKey,
          streamUrl: `https://live.fxengen.com/live/${streamKey}.m3u8`,
          streamType: 'SRS_SOVEREIGN',
        },
      });
    }

    return {
      sessionId: session.id,
      title: session.title,
      status: session.status,
      streamKey,
      ingestEndpoints: {
        rtmpServerUrl: 'rtmp://live.fxengen.com/live',
        rtmpFullUrl: `rtmp://live.fxengen.com/live/${streamKey}`,
        srtServerUrl: `srt://live.fxengen.com:10080?streamid=#!::h=live,m=publish,r=${streamKey}`,
        webrtcWhipUrl: `https://live.fxengen.com/rtc/v1/whip/?app=live&stream=${streamKey}`,
      },
      playbackEndpoints: {
        webrtcPlayback: `https://live.fxengen.com/rtc/v1/play/?app=live&stream=${streamKey}`,
        hlsPlayback: `https://live.fxengen.com/live/${streamKey}.m3u8`,
        flvPlayback: `https://live.fxengen.com/live/${streamKey}.flv`,
      },
      recommendedObsSettings: {
        service: 'Custom...',
        server: 'rtmp://live.fxengen.com/live',
        streamKey,
        videoBitrate: '4500 Kbps (1080p) / 2500 Kbps (720p)',
        keyframeInterval: '2 s (حاسم لمزامنة WebRTC و LL-HLS)',
        audioBitrate: '128 Kbps',
        rateControl: 'CBR',
      },
    };
  }

  /**
   * إعادة توليد مفتاح بث جديد في حال تم تسريبه
   */
  async regenerateStreamCredentials(id: string) {
    const session = await this.prisma.liveSession.findUnique({ where: { id } });
    if (!session) {
      throw new NotFoundException('جلسة البث غير موجودة');
    }

    const newKey = `fx_live_${session.id.slice(-6)}_${crypto.randomBytes(6).toString('hex')}`;
    const newUrl = `https://live.fxengen.com/live/${newKey}.m3u8`;

    await this.prisma.liveSession.update({
      where: { id },
      data: {
        streamKey: newKey,
        streamUrl: newUrl,
        streamType: 'SRS_SOVEREIGN',
      },
    });

    this.logger.log(`Regenerated stream key for session ${id}: ${newKey}`);
    return this.getStreamCredentials(id);
  }

  /**
   * معالجة نداء SRS عند بدء البث من OBS (on_publish)
   */
  async handleMediaServerPublish(streamKey: string, ip?: string) {
    const session = await this.prisma.liveSession.findFirst({
      where: { streamKey },
    });

    if (!session) {
      this.logger.warn(`[SRS Ingest] Rejected stream publish for unknown key: "${streamKey}"`);
      return { code: 1, message: 'Invalid Stream Key' };
    }

    if (session.status === LiveSessionStatus.CANCELLED) {
      this.logger.warn(`[SRS Ingest] Rejected stream publish for cancelled session: ${session.id}`);
      return { code: 1, message: 'Session is cancelled' };
    }

    const now = new Date();
    const updated = await this.prisma.liveSession.update({
      where: { id: session.id },
      data: {
        status: LiveSessionStatus.LIVE,
        actualStartTime: session.actualStartTime || now,
        streamType: 'SRS_SOVEREIGN',
        streamUrl: `https://live.fxengen.com/live/${streamKey}.m3u8`,
      },
    });

    this.logger.log(`[SRS Ingest] Session "${session.title}" (ID: ${session.id}) is now LIVE! Ingest IP: ${ip || 'unknown'}`);

    // إشعار فوري لجميع المتصلين بالقاعة بتغير الحالة إلى مباشر
    this.broadcastToSession(session.id, {
      type: 'STATUS_CHANGED',
      status: 'LIVE',
      actualStartTime: updated.actualStartTime?.toISOString(),
      streamType: 'SRS_SOVEREIGN',
    });

    this.broadcastToSession(session.id, {
      type: 'TIMER_UPDATED',
      sessionId: session.id,
      status: 'LIVE',
      remainingSeconds: 0,
      serverTime: new Date().toISOString(),
    });

    return { code: 0, message: 'Stream authorized and live session started' };
  }

  /**
   * معالجة نداء SRS عند انتهاء البث أو إيقاف OBS (on_unpublish)
   */
  async handleMediaServerUnpublish(streamKey: string) {
    const session = await this.prisma.liveSession.findFirst({
      where: { streamKey },
    });

    if (!session) {
      return { code: 0 };
    }

    const updated = await this.prisma.liveSession.update({
      where: { id: session.id },
      data: {
        status: LiveSessionStatus.ENDED,
        actualEndTime: new Date(),
      },
    });

    this.logger.log(`[SRS Ingest] Session "${session.title}" unpublished. Status changed to ENDED.`);

    this.broadcastToSession(session.id, {
      type: 'STATUS_CHANGED',
      status: 'ENDED',
      actualEndTime: updated.actualEndTime?.toISOString(),
    });

    return { code: 0, message: 'Stream unpublish processed' };
  }

  /**
   * معالجة نداء SRS عند اكتمال كتابة ملف التسجيل (on_dvr)
   */
  async handleMediaServerDvr(streamKey: string, filePath: string) {
    const session = await this.prisma.liveSession.findFirst({
      where: { streamKey },
    });

    if (!session) {
      return { code: 0 };
    }

    const replayUrl = `https://live.fxengen.com/recordings/${streamKey}.mp4`;
    await this.prisma.liveSession.update({
      where: { id: session.id },
      data: {
        isRecordingAvailable: true,
        replayUrl,
      },
    });

    this.logger.log(`[SRS Ingest] Auto DVR saved for session "${session.title}": ${replayUrl}`);

    this.broadcastToSession(session.id, {
      type: 'REPLAY_READY',
      replayUrl,
    });

    return { code: 0, message: 'DVR record saved' };
  }

  /**
   * توليد تذكرة مشاهدة مؤقتة ومحمية بـ Redis Lease للجلسة (Play Ticket)
   */
  async generatePlayTicket(idOrSlug: string, userId?: string, clientIp?: string, accessCode?: string) {
    const session = await this.prisma.liveSession.findFirst({
      where: this.resolveSessionQuery(idOrSlug),
    });

    if (!session) {
      throw new NotFoundException('جلسة البث غير موجودة');
    }

    let user: any = null;
    if (userId) {
      user = await this.prisma.user.findUnique({ where: { id: userId } });
    }

    if (!user) {
      throw new ForbiddenException('يجب تسجيل الدخول أولاً للوصول إلى البث المباشر');
    }

    // التحقق الصارم من الصلاحيات
    const sessionPrice = Number(session.price) || 0;
    const isFree = (session.isFree || sessionPrice <= 0) && session.minTier === CourseAccessTier.FREE;
    if (!isFree) {
      let hasValidAccess = false;

      // 1. تحقق من الكود الممرر
      if (accessCode && typeof accessCode === 'string' && accessCode.trim()) {
        const codeRecord = await this.prisma.liveSessionAccessCode.findFirst({
          where: {
            liveSessionId: session.id,
            accessCode: accessCode.trim().toUpperCase(),
            isRevoked: false,
          },
        });
        if (codeRecord) hasValidAccess = true;
      }

      // 2. تحقق من كود الطالب المسجل (بالمعرف أو البريد الإلكتروني)
      if (!hasValidAccess && (userId || user?.email)) {
        const userCode = await this.prisma.liveSessionAccessCode.findFirst({
          where: {
            liveSessionId: session.id,
            OR: [
              ...(userId ? [{ userId }] : []),
              ...(user?.email ? [{ email: user.email.toLowerCase().trim() }] : []),
            ],
            isRevoked: false,
          },
        });
        if (userCode) hasValidAccess = true;
      }

      // 3. تحقق من عضوية VIP
      if (!hasValidAccess && user) {
        const hasLiveAccess = await this.hasUserPermission(user.id, 'LIVE_STREAMING_ACCESS');
        if (hasLiveAccess) hasValidAccess = true;
      }

      if (!hasValidAccess) {
        if (sessionPrice > 0) {
          throw new ForbiddenException('هذا الكورس المباشر مدفوع ويتطلب كود دخول أو شراء تذكرة');
        }
        if (!user) {
          throw new ForbiddenException('يجب تسجيل الدخول لمشاهدة هذا البث المباشر');
        }
        throw new ForbiddenException('هذا البث مخصص حصراً للمشتركين في باقة تتضمن صلاحية البث المباشر');
      }
    }

    // حجز عقد البث في Redis لمنع فتح الحساب على جهازين في نفس الوقت
    const token = this.createPlayToken(userId || 'guest', session.id, clientIp || '');
    if (userId) {
      await this.redis.acquireStreamLease(userId, token.slice(0, 32), 120);
    }

    const sessionHash = crypto
      .createHash('sha256')
      .update(`${userId || 'guest'}:${session.id}:${Date.now()}`)
      .digest('hex')
      .slice(0, 12);

    const streamKey = session.streamKey || `fx_live_${session.id.slice(-6)}`;

    return {
      success: true,
      sessionId: session.id,
      streamType: session.streamType,
      ticket: token,
      endpoints: {
        webrtcUrl: `https://live.fxengen.com/rtc/v1/play/?app=live&stream=${streamKey}&token=${token}`,
        hlsUrl: `https://live.fxengen.com/live/${streamKey}.m3u8?token=${token}`,
        flvUrl: `https://live.fxengen.com/live/${streamKey}.flv?token=${token}`,
        replayUrl: session.isRecordingAvailable ? session.replayUrl : null,
      },
      watermark: {
        userName: user ? user.fullName : 'عضو زائر',
        userEmail: user ? user.email : 'guest@fxengen.com',
        userId: user ? user.id : 'GUEST',
        clientIp: clientIp || '186.240.xxx.xxx',
        sessionHash,
        issuedAt: new Date().toISOString(),
      },
    };
  }

  private createPlayToken(userId: string, sessionId: string, clientIp: string): string {
    const expiresAt = Date.now() + 6 * 60 * 60 * 1000; // 6 ساعات
    const payload = `${userId}:${sessionId}:${expiresAt}`;
    const hmac = crypto.createHmac('sha256', this.ticketSecret).update(payload).digest('hex');
    const tokenObj = { u: userId, s: sessionId, e: expiresAt, sig: hmac };
    return Buffer.from(JSON.stringify(tokenObj)).toString('base64url');
  }

  verifyPlayToken(token: string, sessionId: string): { userId: string } {
    if (!token) {
      throw new ForbiddenException('تذكرة المشاهدة مفقودة');
    }
    try {
      const raw = Buffer.from(token, 'base64url').toString('utf8');
      const parsed = JSON.parse(raw);
      if (!parsed || !parsed.u || !parsed.s || !parsed.e || !parsed.sig) {
        throw new ForbiddenException('تذكرة المشاهدة غير صالحة');
      }
      if (parsed.s !== sessionId) {
        throw new ForbiddenException('تذكرة المشاهدة مخصصة لبث آخر');
      }
      if (Date.now() > parsed.e) {
        throw new ForbiddenException('انتهت صلاحية جلسة المشاهدة');
      }
      const expectedPayload = `${parsed.u}:${parsed.s}:${parsed.e}`;
      const expectedHmac = crypto.createHmac('sha256', this.ticketSecret).update(expectedPayload).digest('hex');
      if (parsed.sig !== expectedHmac) {
        throw new ForbiddenException('توقيع تذكرة المشاهدة غير مطابق');
      }
      return { userId: parsed.u };
    } catch (err: any) {
      if (err instanceof ForbiddenException) throw err;
      throw new ForbiddenException('فشل فك تشفير تذكرة المشاهدة');
    }
  }

  /**
   * معالجة مصافحة WebRTC من استوديو الويب (In-Browser Studio)
   * يمرر الـ SDP Offer إلى خادم الوسائط SRS ويعيد الـ SDP Answer للمتصفح
   */
  async handleWebRtcPublishSignal(sessionId: string, sdpOffer: string, adminUserId: string) {
    const session = await this.prisma.liveSession.findUnique({ where: { id: sessionId } });
    if (!session) {
      throw new NotFoundException('جلسة البث المباشر غير موجودة');
    }

    if (!session.streamKey) {
      await this.getStreamCredentials(sessionId);
    }

    const currentSession = await this.prisma.liveSession.findUnique({ where: { id: sessionId } });
    const streamKey = currentSession!.streamKey;

    // استهداف خادم الوسائط داخلياً في دوكر أو عبر الـ Host
    const srsCandidates = [
      'http://fxengin-media-server:1985/rtc/v1/publish/',
      'http://127.0.0.1:1985/rtc/v1/publish/',
      'http://186.240.145.87:1985/rtc/v1/publish/',
    ];

    const streamUrl = `webrtc://186.240.145.87/live/${streamKey}`;
    let sdpAnswer: string | null = null;
    let srsSessionId: string | null = null;
    let lastError: any = null;

    for (const srsUrl of srsCandidates) {
      try {
        const response = await fetch(srsUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            api: srsUrl,
            streamurl: streamUrl,
            sdp: sdpOffer,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data && (data.code === 0 || data.sdp)) {
            sdpAnswer = data.sdp;
            srsSessionId = data.sessionid;
            this.logger.log(`[WebRTC Studio] Successfully published to SRS via ${srsUrl} for session ${sessionId}`);
            break;
          } else {
            lastError = data;
          }
        }
      } catch (err: any) {
        lastError = err.message;
      }
    }

    if (!sdpAnswer) {
      this.logger.error(`[WebRTC Studio] Failed to negotiate SDP with SRS for session ${sessionId}: ${JSON.stringify(lastError)}`);
      throw new BadRequestException('فشل في بدء اتصال WebRTC مع خادم البث، يرجى المحاولة مرة أخرى.');
    }

    // تحديث حالة الجلسة إلى LIVE لحظياً وبث الإشعار للحضور
    const updated = await this.prisma.liveSession.update({
      where: { id: session.id },
      data: {
        status: LiveSessionStatus.LIVE,
        actualStartTime: session.actualStartTime || new Date(),
        streamType: 'SRS_SOVEREIGN',
        streamUrl: `https://live.fxengen.com/live/${streamKey}.m3u8`,
      },
    });

    this.broadcastToSession(session.id, {
      type: 'STATUS_CHANGED',
      status: 'LIVE',
      actualStartTime: updated.actualStartTime?.toISOString(),
      streamType: 'SRS_SOVEREIGN',
    });

    this.broadcastToSession(session.id, {
      type: 'TIMER_UPDATED',
      sessionId: session.id,
      status: 'LIVE',
      remainingSeconds: 0,
      serverTime: new Date().toISOString(),
    });

    return {
      code: 0,
      sdp: sdpAnswer,
      sessionId: srsSessionId,
      streamKey,
      status: 'LIVE',
    };
  }

  /**
   * إيقاف البث المباشر من استوديو الويب
   */
  async handleWebRtcStopSignal(sessionId: string, adminUserId: string) {
    const session = await this.prisma.liveSession.findUnique({ where: { id: sessionId } });
    if (!session) {
      throw new NotFoundException('جلسة البث غير موجودة');
    }

    const updated = await this.prisma.liveSession.update({
      where: { id: sessionId },
      data: {
        status: LiveSessionStatus.ENDED,
        actualEndTime: new Date(),
      },
    });

    this.broadcastToSession(sessionId, {
      type: 'STATUS_CHANGED',
      status: 'ENDED',
      actualEndTime: updated.actualEndTime?.toISOString(),
    });

    this.logger.log(`[WebRTC Studio] Session ${sessionId} stopped from in-browser studio by admin ${adminUserId}`);
    return {
      success: true,
      status: 'ENDED',
      message: 'تم إنهاء البث المباشر بنجاح',
    };
  }

  // ===================== إدارة أكواد الدخول الفريدة (Live Course Access Codes) =====================

  /**
   * توليد كود دخول فريد وآمن بتنسيق مميز FXL-XXXX-XXXX
   */
  generateAccessCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let p1 = '';
    let p2 = '';
    for (let i = 0; i < 4; i++) {
      p1 += chars.charAt(crypto.randomInt(0, chars.length));
      p2 += chars.charAt(crypto.randomInt(0, chars.length));
    }
    return `FXL-${p1}-${p2}`;
  }

  /**
   * إضافة مشترك يدوي وتوليد كود دخول فوري من لوحة تحكم المسؤول
   */
  async createManualAccessCode(sessionId: string, dto: CreateManualAccessCodeDto) {
    const session = await this.prisma.liveSession.findUnique({ where: { id: sessionId } });
    if (!session) {
      throw new NotFoundException('جلسة البث المباشر غير موجودة');
    }

    let code = this.generateAccessCode();
    let attempts = 0;
    while (attempts < 5) {
      const exists = await this.prisma.liveSessionAccessCode.findUnique({ where: { accessCode: code } });
      if (!exists) break;
      code = this.generateAccessCode();
      attempts++;
    }

    let linkedUserId = dto.userId;
    if (!linkedUserId && dto.email) {
      const existingUser = await this.prisma.user.findUnique({
        where: { email: dto.email.trim().toLowerCase() },
      });
      if (existingUser) {
        linkedUserId = existingUser.id;
      }
    }

    const accessRecord = await this.prisma.liveSessionAccessCode.create({
      data: {
        liveSessionId: session.id,
        userId: linkedUserId || null,
        email: dto.email.trim().toLowerCase(),
        fullName: dto.fullName.trim(),
        phone: dto.phone?.trim() || null,
        accessCode: code,
        isPaid: true,
        paidAmount: dto.paidAmount !== undefined ? dto.paidAmount : Number(session.price) || 0,
        currency: dto.currency || session.currency || 'USD',
        source: 'MANUAL_ADMIN',
        notes: dto.notes?.trim() || 'تمت الإضافة يدوياً بواسطة الإدارة',
        isRevoked: false,
      },
      include: {
        user: { select: { id: true, fullName: true, email: true } },
      },
    });

    this.logger.log(`Manual access code generated: ${code} for ${dto.email} (Session: ${session.title})`);

    return {
      success: true,
      message: 'تم توليد كود الدخول للمشترك بنجاح',
      accessCode: accessRecord,
    };
  }

  /**
   * معالجة شراء كورس مباشر بعد إتمام الدفع وتوليد كود الدخول التلقائي للطالب
   */
  async processLiveCoursePurchase(idOrSlug: string, dto: LiveCourseCheckoutDto, userId?: string) {
    let session = await this.prisma.liveSession.findFirst({
      where: this.resolveSessionQuery(idOrSlug),
    });
    if (!session) {
      session = await this.prisma.liveSession.findFirst({
        where: { status: { in: ['LIVE', 'SCHEDULED'] } },
        orderBy: { createdAt: 'desc' },
      });
    }
    if (!session) {
      session = await this.prisma.liveSession.findFirst({
        orderBy: { createdAt: 'desc' },
      });
    }
    if (!session) {
      throw new NotFoundException('جلسة البث المباشر غير موجودة');
    }

    const cleanEmail = dto.email.trim().toLowerCase();

    // فحص ما إذا كان البريد الإلكتروني مسجل ولديه كود مسبقاً
    const existingCode = await this.prisma.liveSessionAccessCode.findFirst({
      where: {
        liveSessionId: session.id,
        email: cleanEmail,
        isRevoked: false,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (existingCode) {
      this.logger.log(`Existing access code returned for ${cleanEmail}: ${existingCode.accessCode}`);
      return {
        success: true,
        message: 'تم العثور على كود الدخول الخاص بك والمسجل مسبقاً',
        accessCode: existingCode.accessCode,
        sessionId: session.id,
        sessionSlug: session.slug,
        sessionTitle: session.title,
        scheduledStartTime: session.scheduledStartTime,
        details: existingCode,
      };
    }

    let code = this.generateAccessCode();
    let attempts = 0;
    while (attempts < 5) {
      const exists = await this.prisma.liveSessionAccessCode.findUnique({ where: { accessCode: code } });
      if (!exists) break;
      code = this.generateAccessCode();
      attempts++;
    }

    let linkedUserId = userId;
    if (!linkedUserId && dto.email) {
      const existingUser = await this.prisma.user.findUnique({
        where: { email: cleanEmail },
      });
      if (existingUser) {
        linkedUserId = existingUser.id;
      }
    }

    const accessRecord = await this.prisma.liveSessionAccessCode.create({
      data: {
        liveSessionId: session.id,
        userId: linkedUserId || null,
        email: cleanEmail,
        fullName: dto.fullName.trim(),
        phone: dto.phone?.trim() || null,
        accessCode: code,
        isPaid: true,
        paidAmount: dto.paidAmount !== undefined ? dto.paidAmount : Number(session.price) || 0,
        currency: session.currency || 'USD',
        source: 'CHECKOUT',
        notes: `طلب شراء أونلاين - وسيلة الدفع: ${dto.paymentMethod || 'USDT'}${dto.txid ? ` - المعاملة: ${dto.txid}` : ''}`,
        isRevoked: false,
      },
    });

    // إرسال بريد رسمي بتأكيد حجز التذكرة وكود الدخول عبر Gmail
    if (cleanEmail) {
      const timeStr = session.scheduledStartTime
        ? new Date(session.scheduledStartTime).toLocaleString('ar-EG', { dateStyle: 'full', timeStyle: 'short' })
        : 'سيتم الإعلان عنه قريباً';
      this.mailService
        .sendWebinarConfirmationEmail(
          cleanEmail,
          dto.fullName?.trim() || 'المتداول',
          session.title,
          timeStr,
          code,
          session.slug,
        )
        .catch((err) => this.logger.error(`Failed to send live session ticket email: ${err.message}`));
    }

    this.logger.log(`Access code issued after checkout: ${code} for ${dto.email} (Session: ${session.title})`);

    return {
      success: true,
      message: 'تم تأكيد الدفع وإصدار كود الدخول بنجاح',
      accessCode: accessRecord.accessCode,
      sessionId: session.id,
      sessionSlug: session.slug,
      sessionTitle: session.title,
      scheduledStartTime: session.scheduledStartTime,
      details: accessRecord,
    };
  }

  /**
   * فحص ما إذا كان البريد الإلكتروني مسجل ولديه كود دخول مسبقاً
   */
  async checkEmailAccess(idOrSlug: string, email?: string, userId?: string) {
    let session = await this.prisma.liveSession.findFirst({
      where: this.resolveSessionQuery(idOrSlug),
      select: { id: true, title: true, slug: true, price: true, currency: true, isFree: true },
    });

    if (!session) {
      session = await this.prisma.liveSession.findFirst({
        where: { status: { in: ['LIVE', 'SCHEDULED'] } },
        orderBy: { createdAt: 'desc' },
        select: { id: true, title: true, slug: true, price: true, currency: true, isFree: true },
      });
    }

    if (!session) {
      session = await this.prisma.liveSession.findFirst({
        orderBy: { createdAt: 'desc' },
        select: { id: true, title: true, slug: true, price: true, currency: true, isFree: true },
      });
    }

    if (!session) {
      return { hasAccess: false, session: null };
    }

    const cleanEmail = email ? email.trim().toLowerCase() : null;

    // 1. فحص كود الدخول عبر البريد الإلكتروني
    if (cleanEmail) {
      const accessRecord = await this.prisma.liveSessionAccessCode.findFirst({
        where: {
          liveSessionId: session.id,
          email: cleanEmail,
          isRevoked: false,
        },
        orderBy: { createdAt: 'desc' },
      });

      if (accessRecord) {
        return {
          hasAccess: true,
          accessCode: accessRecord.accessCode,
          fullName: accessRecord.fullName,
          email: accessRecord.email,
          paidAmount: accessRecord.paidAmount,
          currency: accessRecord.currency,
          createdAt: accessRecord.createdAt,
          source: accessRecord.source,
          session: {
            id: session.id,
            title: session.title,
            slug: session.slug,
          },
          message: 'البريد الإلكتروني لديه كود تفعيل نشط لهذا الكورس المباشر',
        };
      }
    }

    // 2. فحص كود الدخول عبر المستخدم المسجل
    if (userId) {
      const userAccessRecord = await this.prisma.liveSessionAccessCode.findFirst({
        where: {
          liveSessionId: session.id,
          userId,
          isRevoked: false,
        },
        orderBy: { createdAt: 'desc' },
      });

      if (userAccessRecord) {
        return {
          hasAccess: true,
          accessCode: userAccessRecord.accessCode,
          fullName: userAccessRecord.fullName,
          email: userAccessRecord.email,
          paidAmount: userAccessRecord.paidAmount,
          currency: userAccessRecord.currency,
          createdAt: userAccessRecord.createdAt,
          source: userAccessRecord.source,
          session: {
            id: session.id,
            title: session.title,
            slug: session.slug,
          },
          message: 'حسابك لديه كود تفعيل نشط لهذا الكورس المباشر',
        };
      }
    }

    return {
      hasAccess: false,
      session: {
        id: session.id,
        title: session.title,
        slug: session.slug,
      },
    };
  }

  /**
   * سرد كافة المشتركين وأكواد الدخول لجلسة بث معينة مع الإحصائيات
   */
  async listSessionAccessCodes(sessionId: string) {
    let session = await this.prisma.liveSession.findFirst({
      where: this.resolveSessionQuery(sessionId),
      select: { id: true, title: true, price: true, currency: true, isFree: true },
    });
    if (!session) {
      session = await this.prisma.liveSession.findFirst({
        where: { status: { in: ['LIVE', 'SCHEDULED'] } },
        orderBy: { createdAt: 'desc' },
        select: { id: true, title: true, price: true, currency: true, isFree: true },
      });
    }
    if (!session) {
      session = await this.prisma.liveSession.findFirst({
        orderBy: { createdAt: 'desc' },
        select: { id: true, title: true, price: true, currency: true, isFree: true },
      });
    }
    if (!session) {
      throw new NotFoundException('جلسة البث غير موجودة');
    }

    const codes = await this.prisma.liveSessionAccessCode.findMany({
      where: { liveSessionId: session.id },
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, fullName: true, email: true } },
      },
    });

    const totalRevenue = codes.reduce((sum, c) => sum + (Number(c.paidAmount) || 0), 0);
    const activeCount = codes.filter((c) => !c.isRevoked).length;
    const usedCount = codes.filter((c) => c.usageCount > 0).length;

    return {
      session,
      totalCount: codes.length,
      activeCount,
      usedCount,
      totalRevenue,
      codes,
    };
  }

  /**
   * إلغاء أو إعادة تفعيل كود دخول
   */
  async toggleRevokeAccessCode(codeId: string, isRevoked?: boolean) {
    const existing = await this.prisma.liveSessionAccessCode.findUnique({ where: { id: codeId } });
    if (!existing) {
      throw new NotFoundException('كود الدخول غير موجود');
    }

    const newRevokedState = isRevoked !== undefined ? isRevoked : !existing.isRevoked;

    const updated = await this.prisma.liveSessionAccessCode.update({
      where: { id: codeId },
      data: { isRevoked: newRevokedState },
    });

    return {
      success: true,
      message: newRevokedState ? 'تم إلغاء صلاحية كود الدخول' : 'تمت إعادة تفعيل كود الدخول',
      accessCode: updated,
    };
  }

  /**
   * إعادة توليد كود دخول جديد لنفس المشترك
   */
  async regenerateAccessCode(codeId: string) {
    const existing = await this.prisma.liveSessionAccessCode.findUnique({ where: { id: codeId } });
    if (!existing) {
      throw new NotFoundException('كود الدخول غير موجود');
    }

    let newCode = this.generateAccessCode();
    let attempts = 0;
    while (attempts < 5) {
      const exists = await this.prisma.liveSessionAccessCode.findUnique({ where: { accessCode: newCode } });
      if (!exists) break;
      newCode = this.generateAccessCode();
      attempts++;
    }

    const updated = await this.prisma.liveSessionAccessCode.update({
      where: { id: codeId },
      data: {
        accessCode: newCode,
        isRevoked: false,
      },
    });

    this.logger.log(`Access code regenerated from ${existing.accessCode} to ${newCode} for ID: ${codeId}`);

    return {
      success: true,
      message: 'تم توليد كود دخول جديد بنجاح',
      accessCode: updated,
    };
  }

  /**
   * التحقق من صلاحية كود الدخول عند دخول قاعة البث المباشر
   */
  async verifyAccessCode(idOrSlug: string, code: string, userId?: string) {
    if (!code || !code.trim()) {
      throw new BadRequestException('يرجى إدخال كود الدخول');
    }

    const cleanCode = code.trim().toUpperCase();

    const session = await this.prisma.liveSession.findFirst({
      where: this.resolveSessionQuery(idOrSlug),
    });
    if (!session) {
      throw new NotFoundException('جلسة البث غير موجودة');
    }

    const accessRecord = await this.prisma.liveSessionAccessCode.findFirst({
      where: {
        liveSessionId: session.id,
        accessCode: cleanCode,
      },
    });

    if (!accessRecord) {
      return {
        valid: false,
        message: 'كود الدخول غير صحيح أو غير مخصص لهذا الكورس المباشر',
      };
    }

    if (accessRecord.isRevoked) {
      return {
        valid: false,
        message: 'تم إلغاء صلاحية هذا الكود من قبل إدارة المنصة',
      };
    }

    // تحديث إحصائيات الاستخدام
    await this.prisma.liveSessionAccessCode.update({
      where: { id: accessRecord.id },
      data: {
        lastUsedAt: new Date(),
        usageCount: { increment: 1 },
        ...(userId && !accessRecord.userId ? { userId } : {}),
      },
    });

    return {
      valid: true,
      message: 'تم التحقق من كود الدخول بنجاح، مرحباً بك في القاعة المباشرة!',
      accessCode: accessRecord.accessCode,
      fullName: accessRecord.fullName,
      email: accessRecord.email,
      sessionId: session.id,
    };
  }

  private formatSessionSummary(s: any) {
    return {
      id: s.id,
      slug: s.slug,
      title: s.title,
      description: s.description,
      coverImage: s.coverImage,
      streamType: s.streamType,
      status: s.status,
      scheduledStartTime: s.scheduledStartTime,
      scheduledEndTime: s.scheduledEndTime,
      actualStartTime: s.actualStartTime,
      minTier: s.minTier,
      isFree: s.isFree,
      price: Number(s.price) || 0,
      currency: s.currency || 'USD',
      instructorName: s.instructorName,
      maxParticipants: s.maxParticipants,
      isRecordingAvailable: s.isRecordingAvailable,
      messagesCount: s._count?.messages || 0,
      accessCodesCount: s._count?.accessCodes || 0,
    };
  }
}

