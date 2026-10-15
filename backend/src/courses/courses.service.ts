import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { Readable } from 'stream';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../common/services/redis.service';
import { WatchHeartbeatDto } from './dto/heartbeat.dto';
import { SubmitQuizAnswersDto } from './dto/quiz.dto';
import { CourseAccessTier } from '@prisma/client';
import { MailService } from '../mail/mail.service';

@Injectable()
export class CoursesService {
  private readonly logger = new Logger(CoursesService.name);
  private readonly ticketSecret =
    process.env.JWT_SECRET || 'fxengin_stream_vault_secret_2026_institutional_grade!';

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly mailService: MailService,
  ) {}

  /**
   * التحقق المباشر مما إذا كان المتداول يملك صلاحية معينة عبر باقاته النشطة
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
   * جلب الكورسات المنشورة للعامة مع البيانات الحقيقية الكاملة وحالة اشتراك المستخدم
   */
  async listPublishedCourses(userId?: string) {
    const enrolledCourseIds = new Set<string>();
    if (userId) {
      try {
        const enrollments = await this.prisma.courseEnrollment.findMany({
          where: {
            userId,
            status: { in: ['COMPLETED', 'ACTIVE'] },
          },
          select: { courseId: true },
        });
        enrollments.forEach((e) => enrolledCourseIds.add(e.courseId));

        const activeEntitlements = await this.prisma.entitlement.findMany({
          where: {
            userId,
            productType: 'RECORDED_COURSE',
            status: 'ACTIVE',
            OR: [{ validUntil: null }, { validUntil: { gt: new Date() } }],
          },
          select: { productId: true },
        });
        activeEntitlements.forEach((e) => enrolledCourseIds.add(e.productId));
      } catch (err) {
        console.warn('Could not check user enrollments in listPublishedCourses:', err);
      }
    }

    const courses = await this.prisma.course.findMany({
      where: { isPublished: true },
      orderBy: { releaseDate: 'desc' },
      include: {
        _count: {
          select: {
            sections: true,
            enrollments: true,
          },
        },
        sections: {
          select: {
            _count: {
              select: { lessons: true },
            },
            lessons: {
              select: { durationSeconds: true },
            },
          },
        },
      },
    });

    return courses.map((c) => {
      let totalLessons = 0;
      let totalDurationSeconds = 0;

      for (const s of c.sections) {
        totalLessons += s._count.lessons;
        for (const l of s.lessons) {
          totalDurationSeconds += l.durationSeconds;
        }
      }

      return {
        id: c.id,
        slug: c.slug,
        title: c.title,
        subtitle: c.subtitle,
        description: c.description,
        thumbnailUrl: c.thumbnailUrl,
        promoVideoUrl: c.promoVideoUrl,
        price: Number(c.price),
        discountPrice: c.discountPrice ? Number(c.discountPrice) : null,
        accessTier: c.accessTier,
        adminRating: c.adminRating,
        adminReviewCount: c.adminReviewCount,
        releaseDate: c.releaseDate,
        difficulty: c.difficulty,
        category: c.category,
        sectionsCount: c._count.sections,
        lessonsCount: totalLessons,
        enrolledStudentsCount: c._count.enrollments,
        totalDurationMinutes: Math.round(totalDurationSeconds / 60),
        isEnrolled: enrolledCourseIds.has(c.id),
      };
    });
  }

  /**
   * جلب صفحة تعريف الكورس العامة مع المنهاج والمحاضرات والمعاينة المجانية المشفرة
   */
  async getCourseBySlug(slug: string, userId?: string, clientIp?: string) {
    const course = await this.prisma.course.findFirst({
      where: {
        OR: [
          { slug },
          { id: slug },
        ],
      },
      include: {
        sections: {
          orderBy: { orderIndex: 'asc' },
          include: {
            lessons: {
              orderBy: { orderIndex: 'asc' },
              select: {
                id: true,
                title: true,
                description: true,
                orderIndex: true,
                durationSeconds: true,
                isFreePreview: true,
                videoUrl: true,
                videoQualities: true,
                requiredWatchPercent: true,
                _count: {
                  select: {
                    resources: true,
                    captions: true,
                  },
                },
                quiz: {
                  select: { id: true, title: true, passingScore: true },
                },
              },
            },
          },
        },
        _count: {
          select: { enrollments: true },
        },
      },
    });

    if (!course || !course.isPublished) {
      throw new NotFoundException('الكورس المطلوب غير موجود أو غير منشور حالياً');
    }

    let isEnrolled = false;
    if (userId) {
      const enrollment = await this.prisma.courseEnrollment.findUnique({
        where: {
          userId_courseId: {
            userId,
            courseId: course.id,
          },
        },
      });

      const activeEntitlement = await this.prisma.entitlement.findFirst({
        where: {
          userId,
          productType: 'RECORDED_COURSE',
          productId: course.id,
          status: 'ACTIVE',
          OR: [
            { validUntil: null },
            { validUntil: { gt: new Date() } },
          ],
        },
      });

      const revokedEntitlement = await this.prisma.entitlement.findFirst({
        where: {
          userId,
          productType: 'RECORDED_COURSE',
          productId: course.id,
          status: 'REVOKED',
        },
      });

      if (enrollment && enrollment.status === 'COMPLETED' && !revokedEntitlement) {
        if (enrollment.paymentMethod === 'ACTIVATION_CODE') {
          isEnrolled = !!activeEntitlement;
        } else {
          isEnrolled = true;
        }
      } else if (activeEntitlement) {
        isEnrolled = true;
      }
    }

    // تأمين الروابط بالكامل: منع تسريب أي روابط فيديو خام (Raw S3/CDN) في الاستجابة
    // الحصص المجانية للمعاينة تحصل على تذكرة بث HMAC مؤقتة فقط، والحصص الأخرى تتطلب دخول قاعة LMS
    const securedSections = course.sections.map((sec) => ({
      ...sec,
      lessons: sec.lessons.map((les) => {
        let securedPreviewUrl: string | null = null;
        const isEmbedStream =
          les.videoUrl &&
          (les.videoUrl.includes('youtube.com') ||
           les.videoUrl.includes('youtu.be') ||
           les.videoUrl.includes('vimeo.com') ||
           les.videoUrl.includes('loom.com'));

        if (les.isFreePreview && les.videoUrl) {
          if (isEmbedStream) {
            securedPreviewUrl = les.videoUrl;
          } else {
            const previewTicket = this.generateStreamTicket(userId || 'guest', les.id, clientIp || '', 'default');
            securedPreviewUrl = `/courses/lessons/${les.id}/stream?ticket=${previewTicket}`;
          }
        }

        return {
          id: les.id,
          title: les.title,
          description: les.description,
          orderIndex: les.orderIndex,
          durationSeconds: les.durationSeconds,
          isFreePreview: les.isFreePreview,
          hasVideo: !!les.videoUrl,
          // لا يتم إرجاع أي رابط خام على الإطلاق
          videoUrl: securedPreviewUrl,
          videoQualities: null,
          requiredWatchPercent: les.requiredWatchPercent,
          hasPdfResources: les._count.resources > 0,
          hasCaptions: les._count.captions > 0,
          hasQuiz: !!les.quiz,
          quizSummary: les.quiz,
        };
      }),
    }));

    return {
      id: course.id,
      slug: course.slug,
      title: course.title,
      subtitle: course.subtitle,
      description: course.description,
      thumbnailUrl: course.thumbnailUrl,
      promoVideoUrl: course.promoVideoUrl,
      price: Number(course.price),
      discountPrice: course.discountPrice ? Number(course.discountPrice) : null,
      accessTier: course.accessTier,
      adminRating: course.adminRating,
      adminReviewCount: course.adminReviewCount,
      releaseDate: course.releaseDate,
      difficulty: course.difficulty,
      category: course.category,
      enrolledStudentsCount: course._count.enrollments,
      isEnrolled,
      sections: securedSections,
    };
  }

  /**
   * تسجيل الطالب في الكورس (مجاناً، بالباقة، أو بإتمام الشراء والدفع مع فحص كوبونات الخصم)
   */
  async enrollInCourse(userId?: string, slug?: string, paymentData?: any) {
    let targetUserId = userId;
    let user = targetUserId ? await this.prisma.user.findUnique({ where: { id: targetUserId } }) : null;

    if (!targetUserId || !user) {
      throw new UnauthorizedException('يجب تسجيل الدخول أولاً للتسجيل في الكورس');
    }

    if (!slug) {
      throw new BadRequestException('معرف الكورس مطلوب');
    }

    const course = await this.prisma.course.findFirst({
      where: {
        OR: [
          { slug },
          { id: slug },
        ],
      },
    });
    if (!course || !course.isPublished) {
      throw new NotFoundException('الكورس غير موجود أو غير منشور');
    }

    const existing = await this.prisma.courseEnrollment.findUnique({
      where: {
        userId_courseId: {
          userId: targetUserId!,
          courseId: course.id,
        },
      },
    });

    if (existing) {
      return { success: true, message: 'أنت مسجل بالفعل في هذا الكورس', enrolledAt: existing.enrolledAt };
    }

    // التحقق من حالة المجانية أو الصلاحيات
    const isPriceFree = Number(course.price) === 0;
    const isTierFree = course.accessTier === CourseAccessTier.FREE;
    const isFree = isPriceFree && isTierFree;

    const isSuperOrAdmin = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';
    const hasAcademyPerm = targetUserId ? await this.hasUserPermission(targetUserId, 'ACADEMY_COURSES_VIP') : false;
    const isVip = user.role === 'VIP' || isSuperOrAdmin || hasAcademyPerm;
    const isTrader = user.role === 'TRADER' || isVip;

    // حساب الخصم المعتمد في حال إرسال كود خصم
    let finalPaid = isFree ? 0 : Number(course.price);
    let discountAmount = 0;
    let appliedCoupon: string | null = null;

    if (paymentData?.couponCode) {
      const code = String(paymentData.couponCode).trim().toUpperCase();
      const coupon = await this.prisma.coupon.findUnique({ where: { code } });
      if (coupon && coupon.isActive) {
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
    }

    // التحقق من الصلاحيات وأهلية التسجيل
    const isEligibleByTier =
      isFree ||
      isSuperOrAdmin ||
      (course.accessTier === CourseAccessTier.VIP && isVip) ||
      (course.accessTier === CourseAccessTier.PRO && isVip) ||
      (course.accessTier === CourseAccessTier.STARTER && isTrader) ||
      finalPaid === 0;

    const providedTxId = paymentData?.txId?.trim() || null;
    let enrollmentStatus = 'COMPLETED';

    if (!isEligibleByTier) {
      // إذا لم يكن مؤهلاً مجاناً، يجب تقديم تفاصيل دفع صالحة
      if (!providedTxId && !paymentData?.paymentMethod) {
        throw new ForbiddenException(
          'هذه الدورة تتطلب اشتراكاً أو إتمام الدفع للوصول. يرجى إتمام عملية الشراء أو إدخال كود خصم صالح.',
        );
      }
      // دفع يدوي قيد التحقق
      enrollmentStatus = 'PENDING_VERIFICATION';
    }

    const enrollment = await this.prisma.courseEnrollment.create({
      data: {
        userId: targetUserId!,
        courseId: course.id,
        paidAmount: finalPaid,
        currency: paymentData?.currency || course.currency || 'USD',
        paymentMethod: paymentData?.paymentMethod || (isFree ? 'FREE' : 'USDT_TRC20'),
        couponCode: appliedCoupon,
        discountAmount: discountAmount || 0,
        txId: providedTxId,
        status: enrollmentStatus,
        buyerName: paymentData?.buyerName || paymentData?.fullName || user.fullName,
        buyerEmail: paymentData?.buyerEmail || paymentData?.email || user.email,
        buyerPhone: paymentData?.buyerPhone || paymentData?.phone || user.phoneNumber,
      },
    });

    // إرسال بريد رسمي بتأكيد التسجيل في الكورس عبر Gmail
    const targetEmail = paymentData?.buyerEmail || paymentData?.email || user.email;
    const targetName = paymentData?.buyerName || paymentData?.fullName || user.fullName;
    if (targetEmail) {
      this.mailService
        .sendCourseEnrollmentEmail(targetEmail, targetName || 'المتداول', course.title, isFree, course.slug)
        .catch((err) => this.logger.error(`Failed to send course enrollment email: ${err.message}`));
    }

    // تحديث رصيد حساب التداول التجريبي (10x من المبلغ المدفوع)
    if (targetUserId) {
      this.syncUserTradingAccountDemoBalance(targetUserId).catch(() => {});
    }

    this.logger.log(`User ${user.email} enrolled in course: ${course.title} (Paid: ${finalPaid})`);
    return {
      success: true,
      message: 'تم شراء والتسجيل في الكورس بنجاح، يمكنك الآن بدء التعلم ومتابعة الحصص!',
      enrollmentId: enrollment.id,
    };
  }

  /**
   * بوابة الطالب التعليمية التفاعلية (LMS Classroom Room)
   * تعرض المشغل المتقدم والعلامة المائية وروابط البث وملفات الـ PDF وتتبع نسبة الإتمام
   */
  async getCourseLearnRoom(userId: string, slug: string, clientIp?: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('المستخدم غير موجود');
    }

    const course = await this.prisma.course.findFirst({
      where: {
        OR: [
          { slug },
          { id: slug },
        ],
      },
      include: {
        sections: {
          orderBy: { orderIndex: 'asc' },
          include: {
            lessons: {
              orderBy: { orderIndex: 'asc' },
              include: {
                captions: true,
                resources: true,
                quiz: {
                  include: {
                    questions: {
                      orderBy: { orderIndex: 'asc' },
                      include: {
                        choices: {
                          select: {
                            id: true,
                            text: true,
                            // حجب الإجابة الصحيحة عن الطالب قبل الحل!
                          },
                        },
                      },
                    },
                  },
                },
                progress: {
                  where: { userId },
                },
              },
            },
          },
        },
      },
    });

    if (!course || !course.isPublished) {
      throw new NotFoundException('الكورس غير موجود');
    }

    // التحقق من التسجيل أو الرتبة أو ترخيص الاستحقاق المركزي (Entitlement)
    const isEnrolled = await this.prisma.courseEnrollment.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId: course.id,
        },
      },
    });

    // فحص الاستحقاق المركزي وكود التفعيل
    const activeEntitlement = await this.prisma.entitlement.findFirst({
      where: {
        userId,
        productType: 'RECORDED_COURSE',
        productId: course.id,
        status: 'ACTIVE',
        OR: [
          { validUntil: null },
          { validUntil: { gt: new Date() } },
        ],
      },
    });

    const revokedEntitlement = await this.prisma.entitlement.findFirst({
      where: {
        userId,
        productType: 'RECORDED_COURSE',
        productId: course.id,
        status: 'REVOKED',
      },
    });

    // إذا كان كود التفعيل ملغياً أو غير صالح، يتم المنع فوراً
    if (revokedEntitlement && !activeEntitlement) {
      if (isEnrolled && isEnrolled.status !== 'REVOKED') {
        await this.prisma.courseEnrollment.update({
          where: { id: isEnrolled.id },
          data: { status: 'REVOKED' },
        }).catch(() => {});
      }
      throw new ForbiddenException('تم إلغاء صلاحية كود التفعيل الخاص بهذه الدورة. يرجى تفعيل كود صالح للدخول.');
    }

    const isPaidCourse = Number(course.price) > 0 || course.accessTier === CourseAccessTier.ONE_TIME;

    let isAuthorized = false;

    // 1. إذا كان لديه استحقاق نشط (كود تفعيل مفعّل وساري)
    if (activeEntitlement) {
      isAuthorized = true;
    }
    // 2. إذا كان مسجلاً بالدفع المباشر والتسجيل مكتمل (وليس كوداً ملغياً)
    else if (isEnrolled && isEnrolled.status === 'COMPLETED' && !revokedEntitlement) {
      if (isEnrolled.paymentMethod === 'ACTIVATION_CODE') {
        isAuthorized = !!activeEntitlement;
      } else {
        isAuthorized = true;
      }
    }
    // 3. الكورسات المجانية بالكامل
    else if (!isPaidCourse && (course.accessTier === CourseAccessTier.FREE || Number(course.price) === 0)) {
      isAuthorized = true;
    }

    if (!isAuthorized) {
      if (isEnrolled && isEnrolled.status === 'PENDING_VERIFICATION') {
        throw new ForbiddenException('طلب اشتراكك في هذه الدورة قيد المراجعة والتحقق المالي من قبل الإدارة. سيتم إرسال كود التفعيل لك فور الاعتماد.');
      }
      throw new ForbiddenException('هذه الدورة تتطلب اشتراكاً مفعّلاً أو كود تفعيل صالح. لا يمكن الدخول لقاعة المحاضرات قبل إتمام الاشتراك أو تفعيل الكود.');
    }

    // تفعيل قيد التسجيل تلقائياً لمن يملك الصلاحية لتسهيل متابعة الإنجاز
    if (!isEnrolled && isAuthorized) {
      await this.prisma.courseEnrollment.upsert({
        where: { userId_courseId: { userId, courseId: course.id } },
        create: { userId, courseId: course.id, status: 'COMPLETED' },
        update: { status: 'COMPLETED' },
      });
    }

    // بناء مصفوفة الدروس مع الروابط الموقعة وتذاكر البث المشفرة
    let hasPreviousLessonCompleted = true;

    const sectionsWithProgress = course.sections.map((section) => {
      const lessons = section.lessons.map((lesson) => {
        const prog = lesson.progress[0] || null;
        const isCompleted = prog ? prog.isCompleted : false;
        const watchedSeconds = prog ? prog.watchedSeconds : 0;

        // الحصة الأولى متاحة، والحصص اللاحقة تفتح عند إتمام الحصة السابقة
        const isUnlocked = hasPreviousLessonCompleted || lesson.isFreePreview;
        hasPreviousLessonCompleted = isCompleted;

        // تشفير وإخفاء الروابط الخام عبر تذاكر البث HMAC الموقعة ذاتياً
        let securedVideoUrl: string | null = null;
        let securedQualities: Record<string, string> | null = null;

        const isEmbedStream =
          lesson.videoUrl &&
          (lesson.videoUrl.includes('youtube.com') ||
           lesson.videoUrl.includes('youtu.be') ||
           lesson.videoUrl.includes('vimeo.com') ||
           lesson.videoUrl.includes('loom.com'));

        if (isUnlocked && lesson.videoUrl) {
          if (isEmbedStream) {
            securedVideoUrl = lesson.videoUrl;
          } else {
            const mainTicket = this.generateStreamTicket(userId, lesson.id, clientIp || '', 'default');
            securedVideoUrl = `/courses/lessons/${lesson.id}/stream?ticket=${mainTicket}`;

            if (lesson.videoQualities && typeof lesson.videoQualities === 'object') {
              securedQualities = {};
              for (const qKey of Object.keys(lesson.videoQualities as Record<string, any>)) {
                const qTicket = this.generateStreamTicket(userId, lesson.id, clientIp || '', qKey);
                securedQualities[qKey] = `/courses/lessons/${lesson.id}/stream?ticket=${qTicket}`;
              }
            }
          }
        }

        const securedResources = isUnlocked
          ? lesson.resources.map((res) => {
              const rTicket = this.generateResourceTicket(userId, lesson.id, res.id);
              return {
                id: res.id,
                title: res.title,
                fileType: res.fileType,
                fileSize: res.fileSize,
                fileUrl: `/courses/lessons/${lesson.id}/resources/${res.id}/download?ticket=${rTicket}`,
              };
            })
          : [];

        return {
          id: lesson.id,
          title: lesson.title,
          description: lesson.description,
          orderIndex: lesson.orderIndex,
          durationSeconds: lesson.durationSeconds,
          videoUrl: securedVideoUrl,
          videoQualities: securedQualities,
          isFreePreview: lesson.isFreePreview,
          requiredWatchPercent: lesson.requiredWatchPercent,
          isUnlocked,
          isCompleted,
          watchedSeconds,
          captions: isUnlocked ? lesson.captions : [],
          resources: securedResources,
          quiz: lesson.quiz,
        };
      });

      return {
        id: section.id,
        title: section.title,
        description: section.description,
        orderIndex: section.orderIndex,
        lessons,
      };
    });

    // بيانات العلامة المائية الآمنة للمشغل
    const watermarkData = {
      userName: user.fullName,
      userEmail: user.email,
      userId: user.id,
      clientIp: clientIp || '186.240.xxx.xxx',
      issuedAt: new Date().toISOString(),
    };

    return {
      course: {
        id: course.id,
        slug: course.slug,
        title: course.title,
        subtitle: course.subtitle,
        thumbnailUrl: course.thumbnailUrl,
        adminRating: course.adminRating,
        difficulty: course.difficulty,
        category: course.category,
      },
      watermark: watermarkData,
      sections: sectionsWithProgress,
    };
  }

  /**
   * توليد تذكرة بث مشفرة موقعة ومحددة الصلاحية (HMAC-SHA256 Expiring Stream Ticket)
   */
  generateStreamTicket(userId: string, lessonId: string, clientIp: string, quality = 'default'): string {
    const expiresAt = Date.now() + 6 * 60 * 60 * 1000; // صالحة لمدة 6 ساعات
    const payload = `${userId}:${lessonId}:${quality}:${expiresAt}`;
    const hmac = crypto.createHmac('sha256', this.ticketSecret).update(payload).digest('hex');
    const ticketObj = { u: userId, l: lessonId, q: quality, e: expiresAt, s: hmac };
    return Buffer.from(JSON.stringify(ticketObj)).toString('base64url');
  }

  /**
   * التحقق الصارم من تذكرة البث ومنع التزوير وانتهاء الصلاحية
   */
  verifyStreamTicket(ticket: string, lessonId: string): { userId: string; quality?: string } {
    if (!ticket) {
      throw new ForbiddenException('تذكرة البث مفقودة');
    }
    try {
      const raw = Buffer.from(ticket, 'base64url').toString('utf8');
      const parsed = JSON.parse(raw);
      if (!parsed || !parsed.u || !parsed.l || !parsed.e || !parsed.s) {
        throw new ForbiddenException('تذكرة البث غير صالحة البنية');
      }
      if (parsed.l !== lessonId) {
        throw new ForbiddenException('تذكرة البث مخصصة لحصة تعليمية أخرى');
      }
      if (Date.now() > parsed.e) {
        throw new ForbiddenException('انتهت صلاحية جلسة البث الحالية، يرجى تحديث الصفحة');
      }
      const expectedPayload = `${parsed.u}:${parsed.l}:${parsed.q || 'default'}:${parsed.e}`;
      const expectedHmac = crypto.createHmac('sha256', this.ticketSecret).update(expectedPayload).digest('hex');
      const sigBuffer = Buffer.from(parsed.s);
      const expectedBuffer = Buffer.from(expectedHmac);
      if (sigBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(sigBuffer, expectedBuffer)) {
        throw new ForbiddenException('فشل التحقق المشفر من تذكرة البث (توقيع غير مطابق)');
      }
      return { userId: parsed.u, quality: parsed.q };
    } catch (err: any) {
      if (err instanceof ForbiddenException) throw err;
      throw new ForbiddenException('فشل فك تشفير تذكرة البث');
    }
  }

  /**
   * توليد تذكرة آمنة لتحميل ملفات الـ PDF والمرفقات
   */
  generateResourceTicket(userId: string, lessonId: string, resourceId: string): string {
    const expiresAt = Date.now() + 4 * 60 * 60 * 1000;
    const payload = `${userId}:${lessonId}:${resourceId}:${expiresAt}`;
    const hmac = crypto.createHmac('sha256', this.ticketSecret).update(payload).digest('hex');
    const ticketObj = { u: userId, l: lessonId, r: resourceId, e: expiresAt, s: hmac };
    return Buffer.from(JSON.stringify(ticketObj)).toString('base64url');
  }

  /**
   * التحقق من تذكرة المرفقات
   */
  verifyResourceTicket(ticket: string, lessonId: string, resourceId: string): { userId: string } {
    if (!ticket) {
      throw new ForbiddenException('تذكرة التحميل مفقودة');
    }
    try {
      const raw = Buffer.from(ticket, 'base64url').toString('utf8');
      const parsed = JSON.parse(raw);
      if (!parsed || parsed.l !== lessonId || parsed.r !== resourceId || Date.now() > parsed.e) {
        throw new ForbiddenException('تذكرة تحميل المرفق غير صالحة أو منتهية الصلاحية');
      }
      const expectedPayload = `${parsed.u}:${parsed.l}:${parsed.r}:${parsed.e}`;
      const expectedHmac = crypto.createHmac('sha256', this.ticketSecret).update(expectedPayload).digest('hex');
      const sigBuffer = Buffer.from(parsed.s);
      const expectedBuffer = Buffer.from(expectedHmac);
      if (sigBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(sigBuffer, expectedBuffer)) {
        throw new ForbiddenException('توقيع تصريح التحميل غير سليم');
      }
      return { userId: parsed.u };
    } catch (err: any) {
      if (err instanceof ForbiddenException) throw err;
      throw new ForbiddenException('فشل التحقق من تصريح التحميل');
    }
  }

  /**
   * بوابة البث الآمن للحصة (Stream Gate)
   * يفحص التذكرة وحجز البث الأحادي في Redis (منع مشاركة الحساب) ثم يتدفق الفيديو كأجزاء مشفرة
   * دون أي تسريب لروابط التخزين الخارجية أو تحويلات 307 المكشوفة
   */
  async streamLessonVideo(lessonId: string, ticket: string, req: any, res: any) {
    const { userId, quality } = this.verifyStreamTicket(ticket, lessonId);

    const lesson = await this.prisma.courseLesson.findUnique({
      where: { id: lessonId },
    });

    if (!lesson) {
      throw new NotFoundException('الحصة التدريبية غير موجودة');
    }

    if (userId === 'guest' && !lesson.isFreePreview) {
      throw new ForbiddenException('المعاينة المجانية غير متاحة لهذه الحصة. يرجى تسجيل الدخول والاشتراك في الكورس.');
    }

    // تفعيل قفل البث الأحادي في Redis لمنع مشاركة الحسابات وتشغيل أكثر من جلسة بنفس اللحظة
    if (userId !== 'guest') {
      await this.redis.acquireStreamLease(userId, ticket.slice(0, 32), 120);
    }

    let targetVideoUrl: string | null = null;
    if (quality && quality !== 'default' && lesson.videoQualities && typeof lesson.videoQualities === 'object') {
      const qualities = lesson.videoQualities as Record<string, string>;
      targetVideoUrl = qualities[quality] || lesson.videoUrl;
    } else {
      targetVideoUrl = lesson.videoUrl;
    }

    if (!targetVideoUrl) {
      throw new NotFoundException('لا يتوفر فيديو لهذه الحصة');
    }

    if (
      targetVideoUrl.includes('youtube.com') ||
      targetVideoUrl.includes('youtu.be') ||
      targetVideoUrl.includes('vimeo.com') ||
      targetVideoUrl.includes('loom.com')
    ) {
      return res.redirect(targetVideoUrl);
    }

    // إرسال هيدرز الحماية الصارمة لمنع المتصفحات ومحركات الكاش من تخزين الفيديو
    res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('X-Content-Type-Options', 'nosniff');

    // تدفق الفيديو بنظام أجزاء HTTP Range (206 Partial Content) لمنع تسريب رابط التخزين الأصلي S3
    if (targetVideoUrl.startsWith('http://') || targetVideoUrl.startsWith('https://')) {
      try {
        const fetchHeaders: Record<string, string> = {};
        if (req?.headers?.range) {
          fetchHeaders['Range'] = req.headers.range;
        }

        const originRes = await fetch(targetVideoUrl, {
          headers: fetchHeaders,
        });

        const status = originRes.status;
        const contentRange = originRes.headers.get('content-range');
        const acceptRanges = originRes.headers.get('accept-ranges') || 'bytes';
        const contentLength = originRes.headers.get('content-length');
        const contentType = originRes.headers.get('content-type') || 'video/mp4';

        res.status(status);
        res.setHeader('Accept-Ranges', acceptRanges);
        res.setHeader('Content-Type', contentType);
        if (contentRange) res.setHeader('Content-Range', contentRange);
        if (contentLength) res.setHeader('Content-Length', contentLength);

        if (originRes.body) {
          const nodeStream = Readable.fromWeb(originRes.body as any);
          return nodeStream.pipe(res);
        } else {
          return res.end();
        }
      } catch (streamErr) {
        this.logger.error(`Failed to proxy stream for lesson ${lessonId}: ${streamErr}`);
        return res.redirect(307, targetVideoUrl);
      }
    }

    return res.redirect(307, targetVideoUrl);
  }

  /**
   * بوابة تحميل المرفقات الآمنة (Resource Download Gate)
   */
  async downloadLessonResource(lessonId: string, resourceId: string, ticket: string, res: any) {
    const { userId } = this.verifyResourceTicket(ticket, lessonId, resourceId);

    const hasPdfPerm = await this.hasUserPermission(userId, 'OFFLINE_DOWNLOADS_PDF');
    if (!hasPdfPerm) {
      throw new ForbiddenException('تحميل ملفات ومذكرات الـ PDF يتطلب باقة تتضمن صلاحية التحميل المباشر.');
    }

    const resource = await this.prisma.lessonResource.findUnique({
      where: { id: resourceId },
    });

    if (!resource || resource.lessonId !== lessonId) {
      throw new NotFoundException('المرفق غير موجود');
    }

    res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(resource.title)}.pdf"`);
    return res.redirect(307, resource.fileUrl);
  }

  /**
   * توثيق نبضات المشاهدة واحتساب وقت المشاهدة الحقيقي (Watch Heartbeat Gate)
   * مدعم بحارس التلاعب الزمني الفعلي (Server-side Wall Clock Delta Guard)
   */
  async recordWatchHeartbeat(userId: string, lessonId: string, dto: WatchHeartbeatDto) {
    const lesson = await this.prisma.courseLesson.findUnique({
      where: { id: lessonId },
    });

    if (!lesson) {
      throw new NotFoundException('الحصة التدريبية غير موجودة');
    }

    const clampedDelta = Math.min(Math.max(dto.deltaSeconds, 1), 30);

    const existingProgress = await this.prisma.lessonProgress.findUnique({
      where: {
        userId_lessonId: {
          userId,
          lessonId,
        },
      },
    });

    // فحص حارس التلاعب الزمني (Anti-Tamper Delta Guard):
    // التأكد أن الفارق الزمني الحقيقي بين النبضة السابقة والحالية يتناسب مع الدلتا المطلوبة
    if (existingProgress && existingProgress.lastHeartbeatAt) {
      const wallClockElapsedSec = (Date.now() - existingProgress.lastHeartbeatAt.getTime()) / 1000;
      if (clampedDelta > 5 && wallClockElapsedSec < clampedDelta - 4 && wallClockElapsedSec > 0) {
        this.logger.warn(
          `Security Alert: Tamper attempt blocked for user ${userId} on lesson ${lessonId}. Claimed: ${clampedDelta}s, Real: ${wallClockElapsedSec.toFixed(1)}s`,
        );
        throw new BadRequestException('تم رصد وتيرة نبضات غير متوافقة مع الزمن الحقيقي لتشغيل الفيديو.');
      }
    }

    // التحقق وتجديد حجز البث الأحادي في Redis لضمان عدم مشاركة الحسابات على عدة أجهزة
    const activeStreamKey = `course:stream:lease:${userId}`;
    const activeLease = await this.redis.get(activeStreamKey);
    if (activeLease) {
      await this.redis.set(activeStreamKey, activeLease, 120);
    }

    let watchedSeconds = clampedDelta;
    let maxWatchPosition = Math.floor(dto.currentTime);

    if (existingProgress) {
      watchedSeconds = existingProgress.watchedSeconds + clampedDelta;
      maxWatchPosition = Math.max(existingProgress.maxWatchPosition, Math.floor(dto.currentTime));
    }

    // حساب النسبة المطلوبة للإتمام
    const targetSeconds = lesson.durationSeconds > 0
      ? Math.floor((lesson.durationSeconds * lesson.requiredWatchPercent) / 100)
      : 30; // افتراضي للحصص بدون مدة محددة

    const isNewlyCompleted = watchedSeconds >= targetSeconds;
    const isCompleted = existingProgress?.isCompleted || isNewlyCompleted;

    const updated = await this.prisma.lessonProgress.upsert({
      where: {
        userId_lessonId: {
          userId,
          lessonId,
        },
      },
      update: {
        watchedSeconds,
        maxWatchPosition,
        isCompleted,
        ...(isNewlyCompleted && !existingProgress?.isCompleted && {
          completionVerifiedAt: new Date(),
        }),
        lastHeartbeatAt: new Date(),
      },
      create: {
        userId,
        lessonId,
        watchedSeconds,
        maxWatchPosition,
        isCompleted,
        ...(isNewlyCompleted && { completionVerifiedAt: new Date() }),
      },
    });

    const percentWatched = lesson.durationSeconds > 0
      ? Math.min(100, Math.round((watchedSeconds / lesson.durationSeconds) * 100))
      : 100;

    return {
      success: true,
      lessonId,
      watchedSeconds,
      targetSeconds,
      percentWatched,
      requiredWatchPercent: lesson.requiredWatchPercent,
      isCompleted: updated.isCompleted,
      completionVerifiedAt: updated.completionVerifiedAt,
      message: updated.isCompleted
        ? 'تهانينا! لقد استوفيت مدة المشاهدة الإلزامية لهذا الدرس بنجاح، تم فتح المحتوى التالي!'
        : `تم تسجيل تقدم المشاهدة: ${percentWatched}% من المدة الإجمالية.`,
    };
  }

  /**
   * تصحيح الاختبار التقييمي وحساب النتيجة الفورية
   */
  async submitQuizAnswers(userId: string, quizId: string, dto: SubmitQuizAnswersDto) {
    const quiz = await this.prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        questions: {
          include: {
            choices: true,
          },
        },
      },
    });

    if (!quiz) {
      throw new NotFoundException('الاختبار غير موجود');
    }

    // فحص المحاولات السابقة
    const attemptCount = await this.prisma.quizAttempt.count({
      where: { quizId, userId },
    });

    if (attemptCount >= quiz.maxAttempts) {
      throw new ForbiddenException(`لقد استنفدت الحد الأقصى للمحاولات (${quiz.maxAttempts} محاولات) لهذا الاختبار.`);
    }

    let totalPoints = 0;
    let earnedPoints = 0;
    const feedback: any[] = [];

    for (const question of quiz.questions) {
      totalPoints += question.points;
      const submitted = dto.answers.find((a) => a.questionId === question.id);
      const correctChoice = question.choices.find((c) => c.isCorrect);

      const isCorrect = submitted && correctChoice && submitted.choiceId === correctChoice.id;

      if (isCorrect) {
        earnedPoints += question.points;
      }

      feedback.push({
        questionId: question.id,
        question: question.question,
        isCorrect: !!isCorrect,
        explanation: question.explanation,
        correctChoiceId: correctChoice?.id,
      });
    }

    const scorePercentage = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 100;
    const isPassed = scorePercentage >= quiz.passingScore;

    const attempt = await this.prisma.quizAttempt.create({
      data: {
        quizId,
        userId,
        score: scorePercentage,
        isPassed,
        answers: dto.answers as any,
        attemptNumber: attemptCount + 1,
      },
    });

    return {
      success: true,
      attemptId: attempt.id,
      attemptNumber: attempt.attemptNumber,
      remainingAttempts: quiz.maxAttempts - (attemptCount + 1),
      score: scorePercentage,
      passingScore: quiz.passingScore,
      isPassed,
      feedback,
      message: isPassed
        ? `أحسنت! لقد اجتزت الاختبار بنجاح بمعدل ${scorePercentage}%!`
        : `للأسف لم تتجاوز درجة النجاح المطلوبة (${quiz.passingScore}%). درجتك الحالية: ${scorePercentage}%.`,
    };
  }

  /**
   * جلب الكورسات المسجلة للطالب الحالي مع نسبة التقدم الحقيقية من قاعدة البيانات
   */
  async getMyEnrolledCourses(userId: string) {
    if (!userId) {
      throw new UnauthorizedException('User ID is required');
    }

    const enrollments = await this.prisma.courseEnrollment.findMany({
      where: {
        userId,
        status: { in: ['COMPLETED', 'ACTIVE'] },
      },
      include: {
        course: {
          include: {
            sections: {
              orderBy: { orderIndex: 'asc' },
              include: {
                lessons: {
                  orderBy: { orderIndex: 'asc' },
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

    const enrolledList = enrollments.map((enr) => {
      const course = enr.course;
      let totalLessons = 0;
      let completedLessons = 0;
      let totalDurationSeconds = 0;
      let lastLessonTitle = '';

      for (const section of course.sections) {
        for (const lesson of section.lessons) {
          totalLessons += 1;
          totalDurationSeconds += lesson.durationSeconds || 0;
          const userProg = lesson.progress?.[0];
          if (userProg?.isCompleted) {
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
      success: true,
      count: enrolledList.length,
      enrolledCourses: enrolledList,
    };
  }

  /**
   * مزامنة رصيد حساب التداول التجريبي للمستخدم وفق قاعدة (10 × إجمالي المدفوع في الجروبات والكورسات)
   */
  async syncUserTradingAccountDemoBalance(userId: string) {
    try {
      const activeSubs = await this.prisma.userSubscription.findMany({
        where: {
          userId,
          status: 'ACTIVE',
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

