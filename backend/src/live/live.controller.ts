import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  Ip,
  Sse,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { LiveService } from './live.service';
import { SendLiveChatMessageDto } from './dto/live-chat.dto';
import { VerifyAccessCodeDto, LiveCourseCheckoutDto } from './dto/access-code.dto';
import { Observable } from 'rxjs';

@ApiTags('Live Streaming & Interactive Broadcasts')
@Controller('live')
export class LiveController {
  constructor(private readonly liveService: LiveService) {}

  @Get()
  @ApiOperation({
    summary: '1. استعراض كروت البث المباشر (دليل الجلسات)',
    description: '📌 لازمتها إيه في الفرونت إند: تستدعيها في صفحة /live لعرض كروت البث المباشر المقسمة (المباشر الآن LIVE، الجلسات المجدولة القادمة SCHEDULED، والتسجيلات السابقة ENDED) مع أسماء المحاضرين وعدد الحضور.',
  })
  @ApiResponse({ status: 200, description: 'قوائم البث المباشر' })
  async listSessions() {
    return this.liveService.listPublicSessions();
  }

  @Get('timer')
  @ApiOperation({
    summary: '2. تايمر العد التنازلي للبث القادم (Hero Countdown Timer)',
    description: '📌 لازمتها إيه في الفرونت إند: تستدعيها في البانر العلوي لصفحة /live لعرض عداد تنازلي دقيق بالثواني (remainingSeconds) متزامن مع ساعة السيرفر لحماية الواجهة من اختلاف توقيت كمبيوتر الزائر.',
  })
  @ApiResponse({ status: 200, description: 'بيانات التايمر والعد التنازلي' })
  async getUpcomingTimer() {
    return this.liveService.getLiveTimer();
  }

  @Get(':idOrSlug/timer')
  @ApiOperation({
    summary: '3. تايمر جلسة بث محددة (Session Waiting Timer)',
    description: '📌 لازمتها إيه في الفرونت إند: تستدعيها داخل قاعة الانتظار للبث المجدول لمعرفة الدقائق والثواني المتبقية حتى يبدأ المحاضر الشرح.',
  })
  @ApiParam({ name: 'idOrSlug', description: 'معرف الجلسة ID أو الـ Slug الرابطي' })
  async getSessionTimer(@Param('idOrSlug') idOrSlug: string) {
    return this.liveService.getLiveTimer(idOrSlug);
  }

  @Get(':idOrSlug')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({
    summary: '4. فحص الصلاحية ودخول القاعة (Classroom Access Gate & Watermark)',
    description: '📌 لازمتها إيه في الفرونت إند: أول Endpoint تستدعيها أول ما يفتح المستخدم صفحة /live/[id]؛ ترجع لك canAccess (true/false) لتعرف هل مسموح له بالمشاهدة أم تظهر له شاشة "يجب الترقية لـ VIP" أو إدخال كود الدخول أو الشراء، وتفحص الكود إن توفر.',
  })
  @ApiParam({ name: 'idOrSlug', description: 'معرف الجلسة أو الـ Slug' })
  @ApiQuery({ name: 'code', required: false, description: 'كود دخول مخصص لحضور الكورس المباشر' })
  async getSessionRoom(
    @Param('idOrSlug') idOrSlug: string,
    @Query('code') accessCode: string,
    @Request() req: any,
    @Ip() clientIp: string,
  ) {
    const userId = req.user?.id;
    const userIp = req.headers['x-forwarded-for'] || clientIp || '186.240.xxx.xxx';
    const effectiveCode = accessCode || req.headers['x-access-code'];
    return this.liveService.getSessionRoom(idOrSlug, userId, String(userIp), effectiveCode);
  }

  @Get(':idOrSlug/play-ticket')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({
    summary: '5. تذكرة تشغيل الفيديو المشفرة (Video Play Ticket & Single-Device Lease)',
    description: '📌 لازمتها إيه في الفرونت إند: تستدعيها لتشغيل الفيديو داخل المشغل SovereignLivePlayer؛ تعيد رابط WebRTC فائق السرعة ورابط LL-HLS مع تذكرة مشفرة، وتتحقق من صلاحية كود الدخول إن كانت الجلسة مدفوعة.',
  })
  @ApiParam({ name: 'idOrSlug', description: 'معرف الجلسة أو الـ Slug' })
  @ApiQuery({ name: 'code', required: false, description: 'كود الدخول المخصص' })
  @ApiResponse({ status: 200, description: 'تم إصدار تذكرة المشاهدة المشفرة وروابط البث السيادية' })
  @ApiResponse({ status: 403, description: 'البث يتطلب باقة VIP أو كود دخول أو تسجيل الدخول' })
  async getPlayTicket(
    @Param('idOrSlug') idOrSlug: string,
    @Query('code') accessCode: string,
    @Request() req: any,
    @Ip() clientIp: string,
  ) {
    const userId = req.user?.id;
    const userIp = req.headers['x-forwarded-for'] || clientIp || '186.240.xxx.xxx';
    const effectiveCode = accessCode || req.headers['x-access-code'];
    return this.liveService.generatePlayTicket(idOrSlug, userId, String(userIp), effectiveCode);
  }

  @Post(':idOrSlug/verify-code')
  @UseGuards(OptionalJwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'التحقق من كود الدخول للكورس المباشر (Verify Live Access Code)',
    description: '📌 لازمتها إيه في الفرونت إند: تستدعيها عند كتابة الطالب لكود الدخول والضغط على زر "دخول القاعة"؛ تتحقق من سلامة الكود وأنه غير ملغي وتسجل حضور الطالب وتسمح له بالدخول.',
  })
  @ApiParam({ name: 'idOrSlug', description: 'معرف الجلسة أو الـ Slug' })
  async verifyCode(
    @Param('idOrSlug') idOrSlug: string,
    @Body() dto: VerifyAccessCodeDto,
    @Request() req: any,
  ) {
    return this.liveService.verifyAccessCode(idOrSlug, dto.code, req.user?.id);
  }

  @Post(':idOrSlug/purchase')
  @UseGuards(OptionalJwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'تسجيل شراء الكورس المباشر وتوليد كود الدخول التلقائي (Purchase Live Course & Issue Access Code)',
    description: '📌 لازمتها إيه في الفرونت إند: تستدعيها صفحة التشيك أوت /checkout بعد إتمام الطالب للدفع؛ تصدر له كود دخول فريد وتعيده للواجهة لعرضه في بطاقة التذكرة وحفظه تلقائياً.',
  })
  @ApiParam({ name: 'idOrSlug', description: 'معرف الجلسة أو الـ Slug' })
  async purchaseCourse(
    @Param('idOrSlug') idOrSlug: string,
    @Body() dto: LiveCourseCheckoutDto,
    @Request() req: any,
  ) {
    return this.liveService.processLiveCoursePurchase(idOrSlug, dto, req.user?.id);
  }

  @Get(':idOrSlug/check-email-access')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({
    summary: 'فحص ما إذا كان البريد الإلكتروني لديه كود تفعيل نشط مسبقاً (Check Email Live Access)',
    description: '📌 لازمتها إيه في الفرونت إند: إذا كان الطالب مسجل مسبقاً ولديه كود، يتم إلغاء شاشة الدفع وعرض كود الدخول مباشرة ليدخل به.',
  })
  @ApiParam({ name: 'idOrSlug', description: 'معرف الجلسة أو الـ Slug' })
  @ApiQuery({ name: 'email', required: false, description: 'البريد الإلكتروني المراد فحصه' })
  async checkEmailAccess(
    @Param('idOrSlug') idOrSlug: string,
    @Query('email') email: string,
    @Request() req: any,
  ) {
    return this.liveService.checkEmailAccess(idOrSlug, email, req.user?.id);
  }


  @Get(':id/chat')
  @ApiOperation({
    summary: '6. جلب أرشيف الشات الأخير (Chat History)',
    description: '📌 لازمتها إيه في الفرونت إند: تستدعيها أول ما تفتح القاعة لتحميل آخر 50 رسالة سابقة في صندوق محادثة البث وعرضها للمستخدم.',
  })
  @ApiParam({ name: 'id', description: 'معرف جلسة البث' })
  async getChatHistory(@Param('id') sessionId: string) {
    return this.liveService.getChatHistory(sessionId);
  }

  @Post(':id/chat')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '7. إرسال رسالة شات جديدة (Send Chat Message)',
    description: '📌 لازمتها إيه في الفرونت إند: تستدعيها لما المستخدم يكتب رسالة ويضغط زر "إرسال"؛ تقوم بحفظ الرسالة ونشرها فوراً لكل الحضور عبر قناة SSE.',
  })
  @ApiParam({ name: 'id', description: 'معرف جلسة البث' })
  async sendChatMessage(
    @Param('id') sessionId: string,
    @Body() dto: SendLiveChatMessageDto,
    @Request() req: any,
  ) {
    return this.liveService.sendChatMessage(sessionId, req.user.id, dto.message);
  }

  @Sse(':id/chat/stream')
  @ApiOperation({
    summary: '8. قناة تدفق الأحداث اللحظية (Real-Time SSE Stream)',
    description: '📌 لازمتها إيه في الفرونت إند: تفتح بها اتصال EventSource دائم بدون Polling؛ تستقبل عبرها رسائل الشات الجديدة لحظة بلحظة، وإشعارات تحول البث إلى LIVE أو ENDED، وتحديثات تايمر الجدولة فورياً.',
  })
  @ApiParam({ name: 'id', description: 'معرف جلسة البث' })
  streamChatEvents(@Param('id') sessionId: string): Observable<{ data: any }> {
    return this.liveService.getChatStream(sessionId);
  }
}
