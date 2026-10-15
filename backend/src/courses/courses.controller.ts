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
  Ip,
  Res,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { CoursesService } from './courses.service';
import { WatchHeartbeatDto } from './dto/heartbeat.dto';
import { SubmitQuizAnswersDto } from './dto/quiz.dto';

@ApiTags('Forex Academy & Courses')
@Controller('courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({
    summary: '1. كتالوج الكورسات المنشورة (Course Catalog)',
    description:
      '📌 **لازمتها إيه في الفرونت إند:**\n' +
      '- تُستدعى في صفحة الأكاديمية الرئيسية (/academy أو /courses).\n' +
      '- تعرض للزائر أو الطالب كروت الكورسات المتاحة، مستواها (مبتدئ/متوسط/محترف)، التقييم الحقيقي، عدد الدروس، والسعر أو علامة (Free/VIP).\n' +
      '- لا تتطلب توكن (Public)؛ أي زائر يمكنه تصفح الكتالوج، وإذا كان مسجلاً يُعاد حالة اشتراكه isEnrolled.',
  })
  @ApiResponse({ status: 200, description: 'قائمة بكافة الكورسات المنشورة مرتبة وجاهزة للعرض' })
  async listPublishedCourses(@Request() req: any) {
    const userId = req?.user?.id;
    return this.coursesService.listPublishedCourses(userId);
  }

  @Get('my-courses')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'جلب الكورسات المسجلة للطالب الحالي (Get Current User Enrolled Courses)',
    description: 'تُرجع قائمة الكورسات التي اشترك فيها الطالب فعلياً مع نسبة التقدم وآخر درس متوقف عنده من قاعدة البيانات.',
  })
  async getMyCourses(@Request() req: any) {
    return this.coursesService.getMyEnrolledCourses(req.user.id);
  }

  @Get('user/my-courses')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'جلب الكورسات المسجلة للطالب الحالي (Alias)',
  })
  async getMyCoursesAlias(@Request() req: any) {
    return this.coursesService.getMyEnrolledCourses(req.user.id);
  }

  @Get(':slug')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({
    summary: '2. صفحة تفاصيل الكورس والسيلابوس (Course Details & Syllabus)',
    description:
      '📌 **لازمتها إيه في الفرونت إند:**\n' +
      '- تُستدعى عند فتح صفحة الكورس التعريفية بالـ slug (مثال: /courses/ict-smart-money).\n' +
      '- تُرجع تفاصيل الكورس الكاملة: الوصف، الأهداف، الفصول (Modules)، وسيلابوس الدروس.\n' +
      '- توضح حالة الطالب: هل هو مسجل بالفعل (`isEnrolled: true`)؟ وما هي الدروس المفتوحة للمعاينة المجانية (`isPreview: true`).\n' +
      '- إذا كان المستخدم مسجلاً دخوله، أرسل Bearer Token لكي يتعرف النظام على اشتراكه فوراً.',
  })
  @ApiParam({ name: 'slug', description: 'الاسم الرابطي الفريد للكورس (مثال: ict-forex-mastery)' })
  async getCourseBySlug(
    @Param('slug') slug: string,
    @Request() req: any,
    @Ip() clientIp: string,
  ) {
    const userId = req.user?.id;
    const userIp = req.headers['x-forwarded-for'] || clientIp || '186.240.xxx.xxx';
    return this.coursesService.getCourseBySlug(slug, userId, String(userIp));
  }

  @Post(':slug/enroll')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '3. زر الانضمام للكورس (Enroll in Course)',
    description:
      '📌 **لازمتها إيه في الفرونت إند:**\n' +
      '- تُربط بزر "ابدأ التعلم الآن" أو "انضم للكورس" في صفحة تفاصيل الكورس.\n' +
      '- تفحص تلقائياً أحقية الطالب: لو الكورس مجاني أو الطالب يمتلك رتبة VIP مطابقة يتم تسجيله فوراً.\n' +
      '- إذا نجح التسجيل، يقوم الفرونت إند بتحويل الطالب مباشرة لقاعة التعلم (`/courses/${slug}/learn`).\n' +
      '- تتطلب تسجيل الدخول (Bearer Token).',
  })
  @ApiParam({ name: 'slug', description: 'الاسم الرابطي للكورس المطلوب التسجيل فيه' })
  async enrollInCourse(
    @Param('slug') slug: string,
    @Request() req: any,
    @Body() body?: any,
  ) {
    return this.coursesService.enrollInCourse(req.user?.id, slug, body);
  }

  @Get(':slug/learn')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '4. قاعة التعلم التفاعلية للطلاب (LMS Classroom Room)',
    description:
      '📌 **لازمتها إيه في الفرونت إند:**\n' +
      '- هذه أهم شاشة في نظام الكورسات (/courses/[slug]/learn).\n' +
      '- تُرجع الشجرة الكاملة للدروس، نسبة التقدم الكلي للطالب، الدرس الحالي، بيانات العلامة المائية الديناميكية (Watermark)، وتذكرة الفيديو المشفرة (`playbackTicket`).\n' +
      '- تُرجع أيضاً قائمة المرفقات والـ PDF الخاصة بكل حصة والاختبار التقييمي (Quiz).\n' +
      '- تتطلب تسجيل الدخول (Bearer Token) واشتراك ساري في الكورس.',
  })
  @ApiParam({ name: 'slug', description: 'الاسم الرابطي للكورس للدخول لقاعة التعلم' })
  async getCourseLearnRoom(
    @Param('slug') slug: string,
    @Request() req: any,
    @Ip() clientIp: string,
  ) {
    const userIp = req.headers['x-forwarded-for'] || clientIp || '186.240.xxx.xxx';
    return this.coursesService.getCourseLearnRoom(req.user.id, slug, String(userIp));
  }

  @Post('lessons/:lessonId/heartbeat')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '5. نبضات تتبع وقت المشاهدة الإلزامي (Watch Heartbeat)',
    description:
      '📌 **لازمتها إيه في الفرونت إند:**\n' +
      '- يتم إرسالها من مشغل الفيديو تلقائياً كل 10-15 ثانية أثناء تشغيل الفيديو (`onTimeUpdate`).\n' +
      '- ترسل: `{ currentTime: 45, duration: 120 }`.\n' +
      '- فائدتها: تضمن أن الطالب يشاهد الحصة فعلياً ولا يستطيع التقديم الوهمي لنهاية الفيديو. عند مشاهدة 80% تُفتح الحصة التالية تلقائياً.\n' +
      '- تتطلب تسجيل الدخول (Bearer Token).',
  })
  @ApiParam({ name: 'lessonId', description: 'المعرف الفريد (UUID) للحصة التدريبية' })
  async recordWatchHeartbeat(
    @Param('lessonId') lessonId: string,
    @Body() dto: WatchHeartbeatDto,
    @Request() req: any,
  ) {
    return this.coursesService.recordWatchHeartbeat(req.user.id, lessonId, dto);
  }

  @Get('lessons/:lessonId/stream')
  @ApiOperation({
    summary: '6. مشغل الفيديو الآمن بالتقطيع التدفقي (Secure Range Stream)',
    description:
      '📌 **لازمتها إيه في الفرونت إند:**\n' +
      '- هذا هو رابط مصدر الفيديو `<video src="https://core.fxengen.com/courses/lessons/:lessonId/stream?ticket=XYZ">`.\n' +
      '- التذكرة `ticket` يتم الحصول عليها من استجابة قاعة التعلم (`/courses/:slug/learn`).\n' +
      '- يدعم HTTP 206 Partial Content (التقديم والتأخير بسلاسة بدون استهلاك الباندويث).\n' +
      '- تمنع سرقة الروابط أو التحميل الخارجي لأن التذكرة منتهية الصلاحية ومربوطة بـ IP الطالب.',
  })
  @ApiParam({ name: 'lessonId', description: 'معرف الحصة المطلوب تشغيل الفيديو الخاص بها' })
  async streamLesson(
    @Param('lessonId') lessonId: string,
    @Request() req: any,
    @Res() res: any,
  ) {
    const ticket = req.query.ticket;
    return this.coursesService.streamLessonVideo(lessonId, ticket, req, res);
  }

  @Get('lessons/:lessonId/resources/:resourceId/download')
  @ApiOperation({
    summary: '7. بوابة التحميل الآمن للمرفقات والملخصات (Secure File Download)',
    description:
      '📌 **لازمتها إيه في الفرونت إند:**\n' +
      '- تُربط بأزرار تحميل ملفات الـ PDF أو إستراتيجيات التداول المرفقة بالدرس.\n' +
      '- الرابط: `https://core.fxengen.com/courses/lessons/:lessonId/resources/:resourceId/download?ticket=XYZ`.\n' +
      '- يقوم السيرفر بضخ الملف للمتصفح كتحميل رسمي آمن مع فحص التذكرة والصلاحية.',
  })
  @ApiParam({ name: 'lessonId', description: 'معرف الحصة' })
  @ApiParam({ name: 'resourceId', description: 'معرف المرفق' })
  async downloadResource(
    @Param('lessonId') lessonId: string,
    @Param('resourceId') resourceId: string,
    @Request() req: any,
    @Res() res: any,
  ) {
    const ticket = req.query.ticket;
    return this.coursesService.downloadLessonResource(lessonId, resourceId, ticket, res);
  }

  @Post('quizzes/:quizId/submit')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '8. تقديم إجابات الكويز التقييمي للحصة (Submit Lesson Quiz)',
    description:
      '📌 **لازمتها إيه في الفرونت إند:**\n' +
      '- تُستدعى عند ضغط الطالب على "إرسال الإجابات" في نافذة الاختبار التقييمي بنهاية الدرس.\n' +
      '- الـ Body يرسل مصفوفة الإجابات: `{ answers: [{ questionId: "...", optionId: "..." }] }`.\n' +
      '- تُرجع النتيجة فوراً بالنسبة المئوية (`scorePercentage`)، مع بيان النجاح/الرسوب (`passed: true/false`).\n' +
      '- في حالة النجاح، يُسمح للطالب بالانتقال للحصة التالية.',
  })
  @ApiParam({ name: 'quizId', description: 'معرف الاختبار التقييمي' })
  async submitQuizAnswers(
    @Param('quizId') quizId: string,
    @Body() dto: SubmitQuizAnswersDto,
    @Request() req: any,
  ) {
    return this.coursesService.submitQuizAnswers(req.user.id, quizId, dto);
  }
}

