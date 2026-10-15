import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCourseDto } from '../../courses/dto/create-course.dto';
import { UpdateCourseDto } from '../../courses/dto/update-course.dto';
import { CreateSectionDto, UpdateSectionDto } from '../../courses/dto/section.dto';
import { CreateLessonDto, UpdateLessonDto, CreateResourceDto, CreateCaptionDto } from '../../courses/dto/lesson.dto';
import { CreateQuizDto } from '../../courses/dto/quiz.dto';
import { CourseAccessTier, CourseLevel } from '@prisma/client';

@Injectable()
export class AdminCoursesService {
  private readonly logger = new Logger(AdminCoursesService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * إنشاء دورة تدريبية جديدة بخصائص متقدمة وتقييم وتاريخ إطلاق أولي من المشرف
   */
  async createCourse(dto: CreateCourseDto) {
    let slug = dto.slug ? dto.slug.trim().toLowerCase() : '';
    if (!slug) {
      slug = dto.title
        .toLowerCase()
        .replace(/[^a-z0-9\u0621-\u064A]+/g, '-')
        .replace(/(^-|-$)/g, '');
      if (!slug) {
        slug = `course-${Date.now()}`;
      } else {
        slug = `${slug}-${Date.now().toString().slice(-4)}`;
      }
    }

    const existing = await this.prisma.course.findUnique({ where: { slug } });
    if (existing) {
      slug = `${slug}-${Date.now().toString().slice(-4)}`;
    }

    const releaseDate = dto.releaseDate ? new Date(dto.releaseDate) : new Date();

    const course = await this.prisma.course.create({
      data: {
        title: dto.title,
        slug,
        subtitle: dto.subtitle,
        description: dto.description,
        thumbnailUrl: dto.thumbnailUrl,
        promoVideoUrl: dto.promoVideoUrl,
        price: dto.price,
        discountPrice: dto.discountPrice,
        accessTier: (dto.accessTier as CourseAccessTier) || CourseAccessTier.FREE,
        adminRating: dto.adminRating !== undefined ? dto.adminRating : 4.9,
        adminReviewCount: dto.adminReviewCount !== undefined ? dto.adminReviewCount : 0,
        releaseDate,
        difficulty: (dto.difficulty as CourseLevel) || CourseLevel.BEGINNER,
        category: dto.category || 'Forex Trading',
        isPublished: dto.isPublished || false,
      },
      include: {
        sections: true,
      },
    });

    this.logger.log(`Admin created new course: ${course.id} (${course.title})`);
    return course;
  }

  /**
   * جلب كافة الكورسات للمشرف مع الإحصائيات
   */
  async findAllCourses() {
    const courses = await this.prisma.course.findMany({
      orderBy: { createdAt: 'desc' },
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
        isPublished: c.isPublished,
        sectionsCount: c._count.sections,
        lessonsCount: totalLessons,
        enrolledStudentsCount: c._count.enrollments,
        totalDurationMinutes: Math.round(totalDurationSeconds / 60),
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      };
    });
  }

  /**
   * جلب كورس كامل للمشرف بكافة الأقسام والحصص والاختبارات والمرفقات
   */
  async findCourseById(id: string) {
    const course = await this.prisma.course.findUnique({
      where: { id },
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
                        choices: true,
                      },
                    },
                  },
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

    if (!course) {
      throw new NotFoundException(`الكورس المطلوب بالمعرف ${id} غير موجود`);
    }

    return {
      ...course,
      price: Number(course.price),
      discountPrice: course.discountPrice ? Number(course.discountPrice) : null,
      enrolledStudentsCount: course._count.enrollments,
    };
  }

  /**
   * تحديث بيانات الكورس
   */
  async updateCourse(id: string, dto: UpdateCourseDto) {
    const course = await this.prisma.course.findUnique({ where: { id } });
    if (!course) {
      throw new NotFoundException(`الكورس غير موجود`);
    }

    const updated = await this.prisma.course.update({
      where: { id },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.subtitle !== undefined && { subtitle: dto.subtitle }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.thumbnailUrl !== undefined && { thumbnailUrl: dto.thumbnailUrl }),
        ...(dto.promoVideoUrl !== undefined && { promoVideoUrl: dto.promoVideoUrl }),
        ...(dto.price !== undefined && { price: dto.price }),
        ...(dto.discountPrice !== undefined && { discountPrice: dto.discountPrice }),
        ...(dto.accessTier !== undefined && { accessTier: dto.accessTier as CourseAccessTier }),
        ...(dto.adminRating !== undefined && { adminRating: dto.adminRating }),
        ...(dto.adminReviewCount !== undefined && { adminReviewCount: dto.adminReviewCount }),
        ...(dto.releaseDate !== undefined && { releaseDate: new Date(dto.releaseDate) }),
        ...(dto.difficulty !== undefined && { difficulty: dto.difficulty as CourseLevel }),
        ...(dto.category !== undefined && { category: dto.category }),
        ...(dto.isPublished !== undefined && { isPublished: dto.isPublished }),
      },
    });

    return {
      ...updated,
      price: Number(updated.price),
      discountPrice: updated.discountPrice ? Number(updated.discountPrice) : null,
    };
  }

  /**
   * حذف كورس بالكامل
   */
  async deleteCourse(id: string) {
    const course = await this.prisma.course.findUnique({ where: { id } });
    if (!course) {
      throw new NotFoundException('الكورس غير موجود');
    }

    await this.prisma.course.delete({ where: { id } });
    return { success: true, message: 'تم حذف الكورس وكافة ملحقاته بنجاح' };
  }

  // ===================== أقسام الكورس (Sections) =====================

  async createSection(courseId: string, dto: CreateSectionDto) {
    const course = await this.prisma.course.findUnique({ where: { id: courseId } });
    if (!course) {
      throw new NotFoundException('الكورس غير موجود');
    }

    return this.prisma.courseSection.create({
      data: {
        courseId,
        title: dto.title,
        description: dto.description,
        orderIndex: dto.orderIndex !== undefined ? dto.orderIndex : 0,
      },
    });
  }

  async updateSection(sectionId: string, dto: UpdateSectionDto) {
    const section = await this.prisma.courseSection.findUnique({ where: { id: sectionId } });
    if (!section) {
      throw new NotFoundException('القسم غير موجود');
    }

    return this.prisma.courseSection.update({
      where: { id: sectionId },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.orderIndex !== undefined && { orderIndex: dto.orderIndex }),
      },
    });
  }

  async deleteSection(sectionId: string) {
    const section = await this.prisma.courseSection.findUnique({ where: { id: sectionId } });
    if (!section) {
      throw new NotFoundException('القسم غير موجود');
    }

    await this.prisma.courseSection.delete({ where: { id: sectionId } });
    return { success: true, message: 'تم حذف القسم بنجاح' };
  }

  // ===================== حصص الكورس (Lessons) =====================

  async createLesson(sectionId: string, dto: CreateLessonDto) {
    const section = await this.prisma.courseSection.findUnique({ where: { id: sectionId } });
    if (!section) {
      throw new NotFoundException('القسم غير موجود');
    }

    let durationSeconds = dto.durationSeconds !== undefined ? Number(dto.durationSeconds) : 0;
    const targetUrl = dto.videoUrl || (dto.videoQualities as any)?.['1080p'];
    if ((!durationSeconds || durationSeconds <= 0) && targetUrl) {
      try {
        const detected = await this.getVideoDuration(targetUrl);
        if (detected?.durationSeconds && detected.durationSeconds > 0) {
          durationSeconds = detected.durationSeconds;
        }
      } catch {
        // Fallback gracefully without breaking lesson creation
      }
    }

    return this.prisma.courseLesson.create({
      data: {
        sectionId,
        title: dto.title,
        description: dto.description,
        orderIndex: dto.orderIndex !== undefined ? dto.orderIndex : 0,
        durationSeconds,
        videoUrl: dto.videoUrl,
        videoQualities: (dto.videoQualities as any) || undefined,
        isFreePreview: dto.isFreePreview || false,
        requiredWatchPercent: dto.requiredWatchPercent !== undefined ? dto.requiredWatchPercent : 80,
      },
    });
  }

  async updateLesson(lessonId: string, dto: UpdateLessonDto) {
    const lesson = await this.prisma.courseLesson.findUnique({ where: { id: lessonId } });
    if (!lesson) {
      throw new NotFoundException('الحصة التدريبية غير موجودة');
    }

    let durationSeconds = dto.durationSeconds !== undefined ? Number(dto.durationSeconds) : undefined;
    const targetUrl = dto.videoUrl || lesson.videoUrl || (dto.videoQualities as any)?.['1080p'];
    if ((durationSeconds === 0 || durationSeconds === undefined) && targetUrl && (durationSeconds === 0 || !lesson.durationSeconds)) {
      try {
        const detected = await this.getVideoDuration(targetUrl);
        if (detected?.durationSeconds && detected.durationSeconds > 0) {
          durationSeconds = detected.durationSeconds;
        }
      } catch {
        // Fallback gracefully
      }
    }

    return this.prisma.courseLesson.update({
      where: { id: lessonId },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.orderIndex !== undefined && { orderIndex: dto.orderIndex }),
        ...(durationSeconds !== undefined && { durationSeconds }),
        ...(dto.videoUrl !== undefined && { videoUrl: dto.videoUrl }),
        ...(dto.videoQualities !== undefined && { videoQualities: dto.videoQualities }),
        ...(dto.isFreePreview !== undefined && { isFreePreview: dto.isFreePreview }),
        ...(dto.requiredWatchPercent !== undefined && { requiredWatchPercent: dto.requiredWatchPercent }),
      },
    });
  }

  async deleteLesson(lessonId: string) {
    const lesson = await this.prisma.courseLesson.findUnique({ where: { id: lessonId } });
    if (!lesson) {
      throw new NotFoundException('الحصة التدريبية غير موجودة');
    }

    await this.prisma.courseLesson.delete({ where: { id: lessonId } });
    return { success: true, message: 'تم حذف الحصة التدريبية بنجاح' };
  }

  // ===================== ملفات PDF والمرفقات (Resources) =====================

  async addResource(lessonId: string, dto: CreateResourceDto) {
    const lesson = await this.prisma.courseLesson.findUnique({ where: { id: lessonId } });
    if (!lesson) {
      throw new NotFoundException('الحصة التدريبية غير موجودة');
    }

    return this.prisma.lessonResource.create({
      data: {
        lessonId,
        title: dto.title,
        fileType: dto.fileType || 'PDF',
        fileUrl: dto.fileUrl,
        fileSize: dto.fileSize,
      },
    });
  }

  async deleteResource(resourceId: string) {
    const res = await this.prisma.lessonResource.findUnique({ where: { id: resourceId } });
    if (!res) {
      throw new NotFoundException('المرفق غير موجود');
    }

    await this.prisma.lessonResource.delete({ where: { id: resourceId } });
    return { success: true, message: 'تم حذف المرفق بنجاح' };
  }

  // ===================== الكابشن والترجمة (Captions) =====================

  async addCaption(lessonId: string, dto: CreateCaptionDto) {
    const lesson = await this.prisma.courseLesson.findUnique({ where: { id: lessonId } });
    if (!lesson) {
      throw new NotFoundException('الحصة التدريبية غير موجودة');
    }

    return this.prisma.lessonCaption.create({
      data: {
        lessonId,
        language: dto.language,
        label: dto.label,
        url: dto.url,
        isDefault: dto.isDefault || false,
      },
    });
  }

  async deleteCaption(captionId: string) {
    const cap = await this.prisma.lessonCaption.findUnique({ where: { id: captionId } });
    if (!cap) {
      throw new NotFoundException('ملف الترجمة غير موجود');
    }

    await this.prisma.lessonCaption.delete({ where: { id: captionId } });
    return { success: true, message: 'تم حذف ملف الترجمة بنجاح' };
  }

  // ===================== الاختبارات (Quizzes) =====================

  async createOrUpdateQuiz(lessonId: string, dto: CreateQuizDto) {
    const lesson = await this.prisma.courseLesson.findUnique({
      where: { id: lessonId },
      include: { quiz: true },
    });

    if (!lesson) {
      throw new NotFoundException('الحصة التدريبية غير موجودة');
    }

    // إذا كان هناك اختبار سابق، نحذفه ونعيد بناءه لضمان الاتساق
    if (lesson.quiz) {
      await this.prisma.quiz.delete({ where: { id: lesson.quiz.id } });
    }

    const quiz = await this.prisma.quiz.create({
      data: {
        lessonId,
        title: dto.title,
        description: dto.description,
        passingScore: dto.passingScore !== undefined ? dto.passingScore : 70,
        maxAttempts: dto.maxAttempts !== undefined ? dto.maxAttempts : 3,
        questions: {
          create: (dto.questions || []).map((q, idx) => ({
            question: q.question,
            orderIndex: q.orderIndex !== undefined ? q.orderIndex : idx,
            points: q.points || 1,
            explanation: q.explanation,
            choices: {
              create: q.choices.map((c) => ({
                text: c.text,
                isCorrect: c.isCorrect,
              })),
            },
          })),
        },
      },
      include: {
        questions: {
          include: { choices: true },
        },
      },
    });

    return quiz;
  }

  async deleteQuiz(quizId: string) {
    const quiz = await this.prisma.quiz.findUnique({ where: { id: quizId } });
    if (!quiz) {
      throw new NotFoundException('الاختبار غير موجود');
    }

    await this.prisma.quiz.delete({ where: { id: quizId } });
    return { success: true, message: 'تم حذف الاختبار بنجاح' };
  }

  // ===================== إدارة الاشتراكات والطلاب والتحليلات (Enrollments & Analytics) =====================

  /**
   * جلب قائمة الطلاب المشتركين في الكورس مع حالة الإتمام والشهادات والبحث
   */
  async getCourseEnrollments(courseId: string, page = 1, limit = 20, search?: string) {
    const course = await this.prisma.course.findUnique({ where: { id: courseId } });
    if (!course) {
      throw new NotFoundException('الكورس غير موجود');
    }

    const skip = (Math.max(1, page) - 1) * limit;

    const where: any = { courseId };
    if (search && search.trim()) {
      where.user = {
        OR: [
          { email: { contains: search.trim(), mode: 'insensitive' } },
          { fullName: { contains: search.trim(), mode: 'insensitive' } },
        ],
      };
    }

    const [total, enrollments] = await Promise.all([
      this.prisma.courseEnrollment.count({ where }),
      this.prisma.courseEnrollment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { enrolledAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              fullName: true,
              phoneNumber: true,
              role: true,
              createdAt: true,
            },
          },
        },
      }),
    ]);

    return {
      courseId,
      courseTitle: course.title,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      enrollments: enrollments.map((e) => ({
        id: e.id,
        userId: e.userId,
        userName: e.buyerName || e.user?.fullName || 'طالب مسجل',
        userEmail: e.buyerEmail || e.user?.email || '—',
        userPhone: e.buyerPhone || e.user?.phoneNumber || '—',
        userRole: e.user?.role || 'USER',
        paidAmount: e.paidAmount !== null && e.paidAmount !== undefined ? Number(e.paidAmount) : Number(course.price || 0),
        currency: e.currency || 'USD',
        paymentMethod: e.paymentMethod || 'USDT_TRC20',
        couponCode: e.couponCode || null,
        discountAmount: e.discountAmount !== null && e.discountAmount !== undefined ? Number(e.discountAmount) : 0,
        txId: e.txId || null,
        status: e.status || 'COMPLETED',
        enrolledAt: e.enrolledAt,
        completedAt: e.completedAt,
        certificateIssued: e.certificateIssued,
      })),
    };
  }

  /**
   * جلب كافة مشتريات واشتراكات الكورسات في المنصة بالكامل
   */
  async getAllCourseEnrollments(page = 1, limit = 50, search?: string) {
    const skip = (Math.max(1, page) - 1) * limit;

    const where: any = {};
    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { buyerName: { contains: q, mode: 'insensitive' } },
        { buyerEmail: { contains: q, mode: 'insensitive' } },
        { couponCode: { contains: q, mode: 'insensitive' } },
        { txId: { contains: q, mode: 'insensitive' } },
        { user: { email: { contains: q, mode: 'insensitive' } } },
        { user: { fullName: { contains: q, mode: 'insensitive' } } },
        { course: { title: { contains: q, mode: 'insensitive' } } },
      ];
    }

    const [total, enrollments] = await Promise.all([
      this.prisma.courseEnrollment.count({ where }),
      this.prisma.courseEnrollment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { enrolledAt: 'desc' },
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
          course: {
            select: {
              id: true,
              title: true,
              slug: true,
              price: true,
              category: true,
            },
          },
        },
      }),
    ]);

    return {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      enrollments: enrollments.map((e) => ({
        id: e.id,
        userId: e.userId,
        userName: e.buyerName || e.user?.fullName || 'طالب مسجل',
        userEmail: e.buyerEmail || e.user?.email || '—',
        userPhone: e.buyerPhone || e.user?.phoneNumber || '—',
        courseId: e.courseId,
        courseTitle: e.course?.title || 'كورس غير محدد',
        courseSlug: e.course?.slug || '',
        coursePrice: e.course?.price ? Number(e.course.price) : 0,
        paidAmount: e.paidAmount !== null && e.paidAmount !== undefined ? Number(e.paidAmount) : Number(e.course?.price || 0),
        currency: e.currency || 'USD',
        paymentMethod: e.paymentMethod || 'USDT_TRC20',
        couponCode: e.couponCode || null,
        discountAmount: e.discountAmount !== null && e.discountAmount !== undefined ? Number(e.discountAmount) : 0,
        txId: e.txId || null,
        status: e.status || 'COMPLETED',
        enrolledAt: e.enrolledAt,
        completedAt: e.completedAt,
        certificateIssued: e.certificateIssued,
      })),
    };
  }

  /**
   * منح صلاحية الكورس لطالب يدوياً عبر الإيميل أو المعرف
   */
  async grantCourseEnrollment(courseId: string, emailOrUserId: string) {
    const course = await this.prisma.course.findUnique({ where: { id: courseId } });
    if (!course) {
      throw new NotFoundException('الكورس غير موجود');
    }

    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { id: emailOrUserId },
          { email: emailOrUserId.toLowerCase().trim() },
        ],
      },
    });

    if (!user) {
      throw new NotFoundException('المستخدم المراد منحه الكورس غير موجود بالمنصة');
    }

    const existing = await this.prisma.courseEnrollment.findUnique({
      where: {
        userId_courseId: {
          userId: user.id,
          courseId,
        },
      },
    });

    if (existing) {
      return {
        success: true,
        message: `المستخدم ${user.fullName} (${user.email}) مسجل بالفعل في هذا الكورس`,
        enrollment: existing,
      };
    }

    const enrollment = await this.prisma.courseEnrollment.create({
      data: {
        userId: user.id,
        courseId,
      },
    });

    return {
      success: true,
      message: `تم منح الطالب ${user.fullName} (${user.email}) حق الوصول للكورس بنجاح`,
      enrollment,
    };
  }

  /**
   * إلغاء أو سحب اشتراك طالب من الكورس
   */
  async revokeCourseEnrollment(courseId: string, userId: string) {
    const existing = await this.prisma.courseEnrollment.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId,
        },
      },
    });

    if (!existing) {
      throw new NotFoundException('المستخدم غير مسجل في هذا الكورس');
    }

    await this.prisma.courseEnrollment.delete({
      where: {
        userId_courseId: {
          userId,
          courseId,
        },
      },
    });

    return {
      success: true,
      message: 'تم سحب صلاحية الكورس من الطالب بنجاح',
    };
  }

  /**
   * إحصائيات وتحليلات أداء الكورس ونسب إتمام الطلاب
   */
  async getCourseAnalytics(courseId: string) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      include: {
        sections: {
          include: {
            lessons: {
              select: { id: true, durationSeconds: true },
            },
          },
        },
      },
    });

    if (!course) {
      throw new NotFoundException('الكورس غير موجود');
    }

    const lessonIds: string[] = [];
    let totalCourseDurationSec = 0;
    for (const s of course.sections) {
      for (const l of s.lessons) {
        lessonIds.push(l.id);
        totalCourseDurationSec += l.durationSeconds;
      }
    }

    const totalEnrollments = await this.prisma.courseEnrollment.count({
      where: { courseId },
    });

    const completedEnrollments = await this.prisma.courseEnrollment.count({
      where: { courseId, completedAt: { not: null } },
    });

    // الطلاب المتفاعلون خلال آخر 7 أيام
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const activeProgressCount = await this.prisma.lessonProgress.groupBy({
      by: ['userId'],
      where: {
        lessonId: { in: lessonIds },
        updatedAt: { gte: sevenDaysAgo },
      },
    });

    const completionRate = totalEnrollments > 0
      ? Math.round((completedEnrollments / totalEnrollments) * 100)
      : 0;

    return {
      courseId,
      title: course.title,
      isPublished: course.isPublished,
      totalEnrollments,
      completedEnrollments,
      completionRate,
      activeStudentsLast7Days: activeProgressCount.length,
      totalLessons: lessonIds.length,
      totalDurationHours: (totalCourseDurationSec / 3600).toFixed(1),
    };
  }

  /**
   * تبديل حالة نشر الكورس (Published / Draft) بنقرة واحدة
   */
  async toggleCoursePublish(courseId: string) {
    const course = await this.prisma.course.findUnique({ where: { id: courseId } });
    if (!course) {
      throw new NotFoundException('الكورس غير موجود');
    }

    const updated = await this.prisma.course.update({
      where: { id: courseId },
      data: { isPublished: !course.isPublished },
    });

    return {
      success: true,
      isPublished: updated.isPublished,
      message: updated.isPublished
        ? 'تم نشر الكورس وإتاحته للمستخدمين في المنصة بنجاح!'
        : 'تم تحويل الكورس إلى مسودة (Draft) وحجبه عن العامة بنجاح.',
    };
  }

  /**
   * استخراج مدة الفيديو تلقائياً بالثواني من رابط (YouTube, Vimeo, الخ)
   */
  async getVideoDuration(url: string) {
    if (!url || typeof url !== 'string') {
      return { success: false, durationSeconds: 0 };
    }

    const trimmed = url.trim();

    // 1. فحص يوتيوب YouTube
    const ytId = this.extractYouTubeId(trimmed);
    if (ytId) {
      const userAgents = [
        'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
        'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
        'Twitterbot/1.0',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      ];

      for (const ua of userAgents) {
        try {
          const response = await fetch(`https://www.youtube.com/watch?v=${ytId}`, {
            headers: {
              'User-Agent': ua,
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
              'Accept-Language': 'en-US,en;q=0.9,ar;q=0.8',
            },
          });
          if (response.ok) {
            const html = await response.text();

            // Pattern 1: itemprop="duration" content="PT27M26S"
            const metaMatch = html.match(/itemprop=["']duration["']\s+content=["']([^"']+)["']/i);
            if (metaMatch && metaMatch[1]) {
              const isoMatch = metaMatch[1].match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/i);
              if (isoMatch) {
                const hours = parseInt(isoMatch[1] || '0', 10);
                const mins = parseInt(isoMatch[2] || '0', 10);
                const secs = parseInt(isoMatch[3] || '0', 10);
                const total = hours * 3600 + mins * 60 + secs;
                if (total > 0) return { success: true, platform: 'youtube', videoId: ytId, durationSeconds: total };
              }
            }

            // Pattern 2: lengthSeconds
            const length = html.match(/["']lengthSeconds["']\s*:\s*["']?(\d+)["']?/);
            if (length && length[1]) {
              const sec = parseInt(length[1], 10);
              if (!isNaN(sec) && sec > 0) return { success: true, platform: 'youtube', videoId: ytId, durationSeconds: sec };
            }

            // Pattern 3: approxDurationMs
            const approx = html.match(/["']approxDurationMs["']\s*:\s*["']?(\d+)["']?/);
            if (approx && approx[1]) {
              const sec = Math.round(parseInt(approx[1], 10) / 1000);
              if (sec > 0) return { success: true, platform: 'youtube', videoId: ytId, durationSeconds: sec };
            }
          }
        } catch (err: any) {
          console.warn('Backend YouTube duration detection error:', err?.message);
        }
      }
    }

    // 2. فحص فيميو Vimeo
    if (trimmed.includes('vimeo.com')) {
      try {
        const response = await fetch(`https://vimeo.com/api/oembed.json?url=${encodeURIComponent(trimmed)}`);
        if (response.ok) {
          const data: any = await response.json();
          if (typeof data?.duration === 'number' && data.duration > 0) {
            return { success: true, platform: 'vimeo', durationSeconds: Math.round(data.duration) };
          }
        }
      } catch (err: any) {
        console.warn('Backend Vimeo duration detection error:', err?.message);
      }
    }

    // 3. فحص ديلي موشن Dailymotion
    if (trimmed.includes('dailymotion.com') || trimmed.includes('dai.ly')) {
      try {
        const match = trimmed.match(/(?:dailymotion\.com\/video\/|dai\.ly\/)([a-zA-Z0-9]+)/);
        if (match && match[1]) {
          const res = await fetch(`https://api.dailymotion.com/video/${match[1]}?fields=duration`);
          if (res.ok) {
            const data: any = await res.json();
            if (typeof data?.duration === 'number' && data.duration > 0) {
              return { success: true, platform: 'dailymotion', durationSeconds: Math.round(data.duration) };
            }
          }
        }
      } catch (err: any) {
        console.warn('Backend Dailymotion duration detection error:', err?.message);
      }
    }

    return { success: false, durationSeconds: 0 };
  }

  private extractYouTubeId(url: string): string | null {
    try {
      const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
      const host = parsed.hostname.toLowerCase();
      if (host.includes('youtu.be')) {
        const id = parsed.pathname.replace(/^\/+/, '').split('/')[0].split('?')[0];
        if (id && id.length >= 10) return id.slice(0, 11);
      }
      if (host.includes('youtube.com')) {
        if (parsed.searchParams.has('v')) {
          const id = parsed.searchParams.get('v');
          if (id) return id.slice(0, 11);
        }
        const parts = parsed.pathname.split('/').filter(Boolean);
        if (['embed', 'v', 'shorts', 'live'].includes(parts[0]) && parts[1]) {
          return parts[1].split('?')[0].slice(0, 11);
        }
      }
    } catch {}
    const match = url.match(
      /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|shorts\/|live\/))([a-zA-Z0-9_-]{11})/
    );
    return match ? match[1] : null;
  }
}

