import { Controller, Post, Body, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { LiveService } from './live.service';
import {
  SrsWebhookOnPublishDto,
  SrsWebhookOnUnpublishDto,
  SrsWebhookOnDvrDto,
} from './dto/srs-webhook.dto';

@ApiTags('Live Streaming Ingestion & Media Server Webhooks')
@Controller('live/hooks')
export class LiveWebhookController {
  private readonly logger = new Logger(LiveWebhookController.name);

  constructor(private readonly liveService: LiveService) {}

  /**
   * ويب هوك مصادقة دفق البث القادم من OBS / vMix عبر خادم SRS
   * يتم استدعاؤه تلقائياً فور بدء إرسال الإشارة؛ إذا كان مفتاح البث صحيحاً يتم قبول البث وتحويل الجلسة إلى LIVE
   */
  @Post('on-publish')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'مصادقة دفق البث المباشر فور بدء الإرسال من OBS Studio / vMix عبر RTMP/SRT',
    description: 'يتحقق من صحة مفتاح البث (Stream Key) ويفعل الجلسة إلى LIVE لحظياً في النظام مع بث إشعار SSE للحضور.',
  })
  @ApiBody({ type: SrsWebhookOnPublishDto })
  @ApiResponse({ status: 200, description: 'تم قبول البث بنجاح وتفعيله', schema: { example: { code: 0 } } })
  @ApiResponse({ status: 403, description: 'تم رفض البث لعدم صحة المفتاح أو انتهاء الجلسة', schema: { example: { code: 1, message: 'Invalid Stream Key' } } })
  async onPublish(@Body() dto: SrsWebhookOnPublishDto) {
    this.logger.log(`[MediaServer Hook] Incoming on_publish event for stream: "${dto.stream}" from IP: ${dto.ip}`);
    return this.liveService.handleMediaServerPublish(dto.stream, dto.ip);
  }

  /**
   * ويب هوك إنهاء دفق البث المباشر فور انقطاع اتصال المذيع أو إيقاف OBS
   */
  @Post('on-unpublish')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'إشعار انقطاع أو انتهاء دفق البث المباشر من OBS Studio',
    description: 'يقوم بتحديث حالة البث المباشر إلى ENDED وإشعار كافة الحضور المتصلين عبر SSE بانتهاء الجلسة.',
  })
  @ApiBody({ type: SrsWebhookOnUnpublishDto })
  @ApiResponse({ status: 200, description: 'تم تسجيل انتهاء البث بنجاح', schema: { example: { code: 0 } } })
  async onUnpublish(@Body() dto: SrsWebhookOnUnpublishDto) {
    this.logger.log(`[MediaServer Hook] Incoming on_unpublish event for stream: "${dto.stream}"`);
    return this.liveService.handleMediaServerUnpublish(dto.stream);
  }

  /**
   * ويب هوك اكتمال تسجيل البث المباشر التلقائي (Auto DVR to MP4)
   */
  @Post('on-dvr')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'تسجيل الفيديو المباشر التلقائي وتحويله إلى أرشيف Replay',
    description: 'يستقبل المسار النهائي لملف الـ MP4 المسجل من خادم الوسائط ويربطه تلقائياً بالجلسة لتصبح متاحة كـ Replay للطلاب.',
  })
  @ApiBody({ type: SrsWebhookOnDvrDto })
  @ApiResponse({ status: 200, description: 'تم حفظ وتحديث رابط التسجيل بنجاح', schema: { example: { code: 0 } } })
  async onDvr(@Body() dto: SrsWebhookOnDvrDto) {
    this.logger.log(`[MediaServer Hook] Incoming on_dvr event for stream: "${dto.stream}", file: "${dto.file}"`);
    return this.liveService.handleMediaServerDvr(dto.stream, dto.file);
  }
}
