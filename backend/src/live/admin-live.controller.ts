import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  BadRequestException,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../admin/guards/admin.guard';
import { LiveService } from './live.service';
import { CreateLiveSessionDto } from './dto/create-live-session.dto';
import { UpdateLiveSessionDto } from './dto/update-live-session.dto';
import { WebRtcPublishSignalDto } from './dto/webrtc-publish.dto';
import { CreateManualAccessCodeDto } from './dto/access-code.dto';
import { LiveSessionStatus } from '@prisma/client';

@ApiTags('Admin Live Broadcast Studio')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AdminGuard)
@Controller('admin/live')
export class AdminLiveController {
  constructor(private readonly liveService: LiveService) {}

  @Get()
  @ApiOperation({ summary: 'سرد كافة جلسات البث المباشر مع تفاصيل الإدارة وعدد الحضور والرسائل' })
  @ApiResponse({ status: 200, description: 'قائمة الجلسات' })
  async listAllSessions() {
    return this.liveService.listAllAdminSessions();
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'جدولة أو إنشاء بث مباشر جديد (HLS, YouTube, OBS, Custom)' })
  @ApiResponse({ status: 201, description: 'تم إنشاء الجلسة بنجاح' })
  async createLiveSession(@Body() dto: CreateLiveSessionDto) {
    return this.liveService.createLiveSession(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'جلب بيانات جلسة البث مع تفاصيل الغرفة' })
  @ApiParam({ name: 'id', description: 'معرف الجلسة' })
  async getSessionById(@Param('id') id: string, @Request() req: any) {
    return this.liveService.getSessionRoom(id, req.user?.id);
  }

  @Get(':id/credentials')
  @ApiOperation({
    summary: '1. بيانات برنامج OBS Studio / vMix (RTMP Server & Stream Key)',
    description: '📌 لازمتها إيه في الفرونت إند: تستدعيها في نافذة مودال "بيانات OBS" لعرض رابط السيرفر ومفتاح البث لنسخهما لمن يفضل استخدام برنامج OBS Studio الخارجي بدلاً من المتصفح.',
  })
  @ApiParam({ name: 'id', description: 'معرف الجلسة' })
  @ApiResponse({ status: 200, description: 'تم جلب بيانات البث بنجاح' })
  async getStreamCredentials(@Param('id') id: string) {
    return this.liveService.getStreamCredentials(id);
  }

  @Post(':id/credentials/regenerate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '2. إعادة توليد مفتاح بث جديد (Regenerate Stream Key)',
    description: '📌 لازمتها إيه في الفرونت إند: يضغط عليها الأدمن في حال تسريب مفتاح البث، لإلغاء المفتاح القديم فوراً وتوليد مفتاح جديد مشفر.',
  })
  @ApiParam({ name: 'id', description: 'معرف الجلسة' })
  @ApiResponse({ status: 200, description: 'تم توليد مفتاح بث جديد بنجاح' })
  async regenerateStreamCredentials(@Param('id') id: string) {
    return this.liveService.regenerateStreamCredentials(id);
  }

  @Post(':id/publish-signal')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '3. بدء البث المباشر من المتصفح (Web Studio WebRTC Publish)',
    description: '📌 لازمتها إيه في الفرونت إند: الزر الأحمر "🔴 بدء البث" في استوديو الويب؛ يأخذ عرض SDP Offer من المتصفح ويمرره لخادم الوسائط ويعيد SDP Answer لبدء إرسال شاشة MT5 والكاميرا والمايك ويحول الجلسة تلقائياً إلى LIVE.',
  })
  @ApiParam({ name: 'id', description: 'معرف الجلسة' })
  @ApiResponse({ status: 200, description: 'تم تأسيس اتصال WebRTC وتفعيل البث بنجاح' })
  async publishSignal(
    @Param('id') id: string,
    @Body() dto: WebRtcPublishSignalDto,
    @Request() req: any,
  ) {
    return this.liveService.handleWebRtcPublishSignal(id, dto.sdp, req.user.id);
  }

  @Post(':id/stop-signal')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '4. إنهاء البث المباشر من المتصفح (Web Studio WebRTC Stop)',
    description: '📌 لازمتها إيه في الفرونت إند: زر "⏹️ إنهاء البث" في استوديو الويب؛ يوقف البث ويحول حالة الجلسة إلى ENDED ويبث إشعار انتهاء الجلسة للطلاب فورياً.',
  })
  @ApiParam({ name: 'id', description: 'معرف الجلسة' })
  @ApiResponse({ status: 200, description: 'تم إيقاف البث بنجاح' })
  async stopSignal(
    @Param('id') id: string,
    @Request() req: any,
  ) {
    return this.liveService.handleWebRtcStopSignal(id, req.user.id);
  }


  @Put(':id')
  @ApiOperation({
    summary: '5. تعديل بيانات الجلسة (Update Live Session)',
    description: '📌 لازمتها إيه في الفرونت إند: تعديل العنوان، الوصف، صورة الغلاف، مستوى الاشتراك المطلوب، أو المدرب.',
  })
  @ApiParam({ name: 'id', description: 'معرف الجلسة' })
  async updateLiveSession(@Param('id') id: string, @Body() dto: UpdateLiveSessionDto) {
    return this.liveService.updateLiveSession(id, dto);
  }

  @Patch(':id/timer')
  @ApiOperation({
    summary: '6. جدولة وتعديل تايمر موعد البث (Schedule & Timer Adjustment)',
    description: '📌 لازمتها إيه في الفرونت إند: تستخدم عند الضغط على أزرار التايمر السريعة (+15m, +30m, +1h أو إدخال موعد محدد)؛ تحدث الموعد في الداتابيز وترسل إشعار SSE لحظي لكل شاشات الحضور بتحديث العداد دون إعادة تحميل الصفحة.',
  })
  @ApiParam({ name: 'id', description: 'معرف الجلسة' })
  async setSessionTimer(
    @Param('id') id: string,
    @Body('scheduledStartTime') scheduledStartTime?: string,
    @Body('addMinutes') addMinutes?: number,
  ) {
    let targetTime: Date;
    if (scheduledStartTime) {
      targetTime = new Date(scheduledStartTime);
    } else if (addMinutes && typeof addMinutes === 'number') {
      targetTime = new Date(Date.now() + addMinutes * 60 * 1000);
    } else {
      throw new BadRequestException('يجب توفير موعد مجدول scheduledStartTime أو دقائق مضافة addMinutes');
    }

    if (isNaN(targetTime.getTime())) {
      throw new BadRequestException('صيغة التاريخ المجدول غير صالحة');
    }

    return this.liveService.updateLiveTimer(id, targetTime);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'تغيير حالة البث فورياً (بدء البث LIVE، إنهاء البث ENDED، إلغاء CANCELLED)' })
  @ApiParam({ name: 'id', description: 'معرف الجلسة' })
  async setSessionStatus(
    @Param('id') id: string,
    @Body('status') status: LiveSessionStatus,
  ) {
    return this.liveService.setSessionStatus(id, status);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'حذف جلسة البث المباشر نهائياً' })
  @ApiParam({ name: 'id', description: 'معرف الجلسة' })
  async deleteLiveSession(@Param('id') id: string) {
    return this.liveService.deleteLiveSession(id);
  }

  @Post(':id/chat/:messageId/pin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'تثبيت أو إلغاء تثبيت رسالة شات في أعلى القاعة' })
  async pinChatMessage(
    @Param('messageId') messageId: string,
    @Body('isPinned') isPinned: boolean,
  ) {
    return this.liveService.pinChatMessage(messageId, isPinned);
  }

  @Delete(':id/chat/:messageId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'حذف رسالة مسيئة من الدردشة المباشرة وبث الحذف لحظياً للحضور' })
  async deleteChatMessage(@Param('messageId') messageId: string) {
    return this.liveService.deleteChatMessage(messageId);
  }

  // ==========================================
  // أكواد الدخول وإدارة المشتركين (Live Access Codes)
  // ==========================================

  @Get(':id/access-codes')
  @ApiOperation({ summary: 'سرد كافة المشتركين وأكواد الدخول لجلسة البث مع إحصائيات الإيرادات والحضور' })
  @ApiParam({ name: 'id', description: 'معرف جلسة البث المباشر' })
  async listSessionAccessCodes(@Param('id') id: string) {
    return this.liveService.listSessionAccessCodes(id);
  }

  @Post(':id/access-codes')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'إضافة طالب/مشترك يدوي وتوليد كود دخول فريد له' })
  @ApiParam({ name: 'id', description: 'معرف جلسة البث المباشر' })
  async createManualAccessCode(
    @Param('id') id: string,
    @Body() dto: CreateManualAccessCodeDto,
  ) {
    return this.liveService.createManualAccessCode(id, dto);
  }

  @Patch('access-codes/:codeId/revoke')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'إلغاء أو إعادة تفعيل صلاحية كود الدخول' })
  @ApiParam({ name: 'codeId', description: 'معرف سجل كود الدخول' })
  async toggleRevokeAccessCode(
    @Param('codeId') codeId: string,
    @Body('isRevoked') isRevoked?: boolean,
  ) {
    return this.liveService.toggleRevokeAccessCode(codeId, isRevoked);
  }

  @Post('access-codes/:codeId/regenerate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'إعادة توليد كود دخول جديد لنفس المشترك' })
  @ApiParam({ name: 'codeId', description: 'معرف سجل كود الدخول' })
  async regenerateAccessCode(@Param('codeId') codeId: string) {
    return this.liveService.regenerateAccessCode(codeId);
  }
}
