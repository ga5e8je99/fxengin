import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../guards/admin.guard';
import { AdminCoursesService } from './admin-courses.service';
import { CreateCourseDto } from '../../courses/dto/create-course.dto';
import { UpdateCourseDto } from '../../courses/dto/update-course.dto';
import { CreateSectionDto, UpdateSectionDto } from '../../courses/dto/section.dto';
import { CreateLessonDto, UpdateLessonDto, CreateResourceDto, CreateCaptionDto } from '../../courses/dto/lesson.dto';
import { CreateQuizDto } from '../../courses/dto/quiz.dto';

@ApiTags('Admin LMS & Courses Management')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('admin/courses')
export class AdminCoursesController {
  constructor(private readonly adminCoursesService: AdminCoursesService) {}

  // ===================== الكورسات (Courses) =====================

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'إنشاء دورة تدريبية جديدة ببيانات كاملة (التقييم الأولي، تاريخ الإطلاق، السعر، الفيديو الإعلاني، صورة الغلاف)' })
  @ApiResponse({ status: 201, description: 'تم إنشاء الكورس بنجاح' })
  async createCourse(@Body() dto: CreateCourseDto) {
    return this.adminCoursesService.createCourse(dto);
  }

  @Get()
  @ApiOperation({ summary: 'سرد كافة الكورسات التدريبية في المنصة مع الإحصائيات (عدد الأقسام، الحصص، الطلاب، وحالة النشر)' })
  @ApiResponse({ status: 200, description: 'قائمة الكورسات' })
  async findAllCourses() {
    return this.adminCoursesService.findAllCourses();
  }

  @Get('video-duration')
  @ApiOperation({ summary: 'استخراج مدة الفيديو تلقائياً بالثواني من الرابط (YouTube, Vimeo)' })
  @ApiResponse({ status: 200, description: 'مدة الفيديو بالثواني' })
  async getVideoDuration(@Query('url') url: string) {
    return this.adminCoursesService.getVideoDuration(url);
  }

  @Post('video-duration')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'استخراج مدة الفيديو تلقائياً بالثواني من الرابط عبر POST' })
  @ApiResponse({ status: 200, description: 'مدة الفيديو بالثواني' })
  async postVideoDuration(@Body('url') url: string) {
    return this.adminCoursesService.getVideoDuration(url);
  }

  @Get(':id')
  @ApiOperation({ summary: 'جلب التفاصيل الكاملة للكورس مع كافة الأقسام والحصص والمرفقات والاختبارات' })
  @ApiParam({ name: 'id', description: 'معرف الكورس' })
  async findCourseById(@Param('id') id: string) {
    return this.adminCoursesService.findCourseById(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'تحديث بيانات الكورس (الأسعار، التقييم، تاريخ النشر، حالة النشر، الفيديوهات)' })
  @ApiParam({ name: 'id', description: 'معرف الكورس' })
  async updateCourse(@Param('id') id: string, @Body() dto: UpdateCourseDto) {
    return this.adminCoursesService.updateCourse(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'حذف الكورس نهائياً مع كافة فصوله وحصصه وملحقاته' })
  @ApiParam({ name: 'id', description: 'معرف الكورس' })
  async deleteCourse(@Param('id') id: string) {
    return this.adminCoursesService.deleteCourse(id);
  }

  // ===================== الأقسام (Sections) =====================

  @Post(':courseId/sections')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'إضافة قسم أو فصل تدريبي جديد للكورس' })
  async createSection(@Param('courseId') courseId: string, @Body() dto: CreateSectionDto) {
    return this.adminCoursesService.createSection(courseId, dto);
  }

  @Put('sections/:sectionId')
  @ApiOperation({ summary: 'تعديل أو إعادة ترتيب القسم التدريبي' })
  async updateSection(@Param('sectionId') sectionId: string, @Body() dto: UpdateSectionDto) {
    return this.adminCoursesService.updateSection(sectionId, dto);
  }

  @Delete('sections/:sectionId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'حذف القسم التدريبي بالكامل' })
  async deleteSection(@Param('sectionId') sectionId: string) {
    return this.adminCoursesService.deleteSection(sectionId);
  }

  // ===================== الحصص والدروس (Lessons) =====================

  @Post('sections/:sectionId/lessons')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'إضافة حصة تدريبية جديدة مع روابط الفيديو متعددة الجودات ونسبة المشاهدة الإلزامية' })
  async createLesson(@Param('sectionId') sectionId: string, @Body() dto: CreateLessonDto) {
    return this.adminCoursesService.createLesson(sectionId, dto);
  }

  @Put('lessons/:lessonId')
  @ApiOperation({ summary: 'تحديث بيانات الحصة التدريبية ورابط البث ونسبة المشاهدة' })
  async updateLesson(@Param('lessonId') lessonId: string, @Body() dto: UpdateLessonDto) {
    return this.adminCoursesService.updateLesson(lessonId, dto);
  }

  @Delete('lessons/:lessonId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'حذف الحصة التدريبية' })
  async deleteLesson(@Param('lessonId') lessonId: string) {
    return this.adminCoursesService.deleteLesson(lessonId);
  }

  // ===================== ملفات PDF والمرفقات (Resources) =====================

  @Post('lessons/:lessonId/resources')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'إرفاق ملف PDF أو ملف برمجي تدريبي بالحصة' })
  async addResource(@Param('lessonId') lessonId: string, @Body() dto: CreateResourceDto) {
    return this.adminCoursesService.addResource(lessonId, dto);
  }

  @Delete('lessons/resources/:resourceId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'حذف المرفق التدريبي' })
  async deleteResource(@Param('resourceId') resourceId: string) {
    return this.adminCoursesService.deleteResource(resourceId);
  }

  // ===================== الترجمة والكابشن (Captions) =====================

  @Post('lessons/:lessonId/captions')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'إضافة ملف ترجمة وكابشن (.vtt) للحصة التدريبية' })
  async addCaption(@Param('lessonId') lessonId: string, @Body() dto: CreateCaptionDto) {
    return this.adminCoursesService.addCaption(lessonId, dto);
  }

  @Delete('lessons/captions/:captionId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'حذف ملف الترجمة والكابشن' })
  async deleteCaption(@Param('captionId') captionId: string) {
    return this.adminCoursesService.deleteCaption(captionId);
  }

  // ===================== الاختبارات (Quizzes) =====================

  @Post('lessons/:lessonId/quiz')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'إنشاء أو استبدال اختبار تقييمي للحصة التدريبية مع الأسئلة والخيارات' })
  async createOrUpdateQuiz(@Param('lessonId') lessonId: string, @Body() dto: CreateQuizDto) {
    return this.adminCoursesService.createOrUpdateQuiz(lessonId, dto);
  }

  @Delete('quizzes/:quizId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'حذف الاختبار التقييمي' })
  async deleteQuiz(@Param('quizId') quizId: string) {
    return this.adminCoursesService.deleteQuiz(quizId);
  }

  // ===================== إدارة الاشتراكات والطلاب والتحليلات =====================

  @Get('enrollments/all')
  @ApiOperation({ summary: 'سرد كافة مشتريات واشتراكات الكورسات في المنصة بالكامل مع تفاصيل الدفع والخصم' })
  async getAllCourseEnrollments(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    return this.adminCoursesService.getAllCourseEnrollments(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 50,
      search,
    );
  }

  @Get(':id/enrollments')
  @ApiOperation({ summary: 'سرد الطلاب المسجلين في الكورس مع حالة الإتمام وتاريخ التسجيل والبحث' })
  @ApiParam({ name: 'id', description: 'معرف الكورس' })
  async getCourseEnrollments(
    @Param('id') courseId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    return this.adminCoursesService.getCourseEnrollments(
      courseId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
      search,
    );
  }

  @Post(':id/enrollments/grant')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'منح طالب صلاحية الوصول للكورس يدوياً' })
  @ApiParam({ name: 'id', description: 'معرف الكورس' })
  async grantCourseEnrollment(
    @Param('id') courseId: string,
    @Body('emailOrUserId') emailOrUserId: string,
  ) {
    return this.adminCoursesService.grantCourseEnrollment(courseId, emailOrUserId);
  }

  @Delete(':id/enrollments/:userId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'سحب أو إلغاء اشتراك طالب من الكورس' })
  @ApiParam({ name: 'id', description: 'معرف الكورس' })
  @ApiParam({ name: 'userId', description: 'معرف المستخدم' })
  async revokeCourseEnrollment(
    @Param('id') courseId: string,
    @Param('userId') userId: string,
  ) {
    return this.adminCoursesService.revokeCourseEnrollment(courseId, userId);
  }

  @Get(':id/analytics')
  @ApiOperation({ summary: 'تحليلات أداء الكورس ونسب إتمام الطلاب والتفاعل الأسبوعي' })
  @ApiParam({ name: 'id', description: 'معرف الكورس' })
  async getCourseAnalytics(@Param('id') courseId: string) {
    return this.adminCoursesService.getCourseAnalytics(courseId);
  }

  @Post(':id/publish-toggle')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'تبديل حالة النشر بنقرة واحدة (نشر / مسودة)' })
  @ApiParam({ name: 'id', description: 'معرف الكورس' })
  async toggleCoursePublish(@Param('id') courseId: string) {
    return this.adminCoursesService.toggleCoursePublish(courseId);
  }
}

