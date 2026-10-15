import { Controller, Get, Post, Param, Query, Res, HttpStatus } from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiParam, 
  ApiQuery, 
  ApiOkResponse, 
  ApiProduces, 
  ApiResponse 
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Response } from 'express';
import { AnalystService } from './analyst.service';
import { AnalystShareResponseDto, FreshSnapshotResponseDto } from './dto/analyst.dto';

@ApiTags('Technical Analysis & MT5 Live Desk')
@Controller('analyst')
export class AnalystController {
  constructor(private readonly analystService: AnalystService) {}

  @Get('share/:symbol')
  @Throttle({ default: { limit: 100, ttl: 60000 } })
  @ApiOperation({
    summary: '1. تقرير التحليل الفني ومناطق الدخول الذكية (Institutional Analysis & SMC)',
    description:
      '📌 **لازمتها إيه في الفرونت إند:**\n' +
      '- تُستدعى في صفحة التوصيات أو تفاصيل عملة/ذهب معينة (مثال: /analysis/XAUUSD).\n' +
      '- تُرجع: الاتجاه العام (صاعد/هابط/حيادي)، مناطق الدخول المقترحة (Entry Zone)، وقف الخسارة (Stop Loss)، الأهداف الربحية (Take Profit 1, 2, 3)، ومناطق الفجوات السعرية (FVG) والكتل السعرية (Order Blocks).\n' +
      '- تدعم وسيط `?lang=ar` للتقرير باللغة العربية أو `?lang=en` للإنجليزية.\n' +
      '- لا تتطلب توكن (Public).',
  })
  @ApiParam({
    name: 'symbol',
    required: true,
    description: 'رمز الزوج المطلوب تحليله (مثال: XAUUSD للذهب، EURUSD لليورو)',
    example: 'XAUUSD',
  })
  @ApiQuery({
    name: 'lang',
    required: false,
    description: 'لغة التحرير للتقرير الفني (ar أو en)',
    example: 'ar',
  })
  @ApiOkResponse({
    description: 'تم جلب التقرير الفني ومستويات التداول بنجاح.',
    type: AnalystShareResponseDto,
  })
  async getAnalysis(
    @Param('symbol') symbol: string,
    @Query('lang') lang?: string,
  ): Promise<AnalystShareResponseDto> {
    return this.analystService.getAnalysis(symbol, lang || 'ar');
  }

  @Get('share/:symbol/image')
  @Throttle({ default: { limit: 120, ttl: 60000 } })
  @ApiOperation({
    summary: '2. صورة شارت الـ MT5 الحية فائقة الدقة (Live Chart Image PNG)',
    description:
      '📌 **لازمتها إيه في الفرونت إند:**\n' +
      '- تُستخدم كـ `src` مباشر لتاغ الصورة: `<img src="https://core.fxengen.com/analyst/share/XAUUSD/image" />`.\n' +
      '- تُرجع لقطة شاشة ثنائية نقية (PNG) مأخوذة فوراً من منصة MetaTrader 5 مع المؤشرات والموجات مرسومة عليها.\n' +
      '- مفيدة في بطاقات المشاركة السريعة على وسائل التواصل أو في خلفيات كروت التحليل.',
  })
  @ApiParam({
    name: 'symbol',
    required: true,
    description: 'رمز الزوج (مثال: XAUUSD)',
    example: 'XAUUSD',
  })
  @ApiProduces('image/png')
  @ApiResponse({
    status: 200,
    description: 'صورة ثنائية PNG لشارت منصة MT5.',
  })
  async getChartImage(
    @Param('symbol') symbol: string,
    @Res() res: Response,
  ) {
    const { buffer, contentType } = await this.analystService.getChartImage(symbol);
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=10');
    res.status(HttpStatus.OK).send(buffer);
  }

  @Post('snapshot/request-fresh/:symbol')
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @ApiOperation({
    summary: '3. زر إعادة التقاط الشارت فوراً من MT5 (Request Fresh Snapshot)',
    description:
      '📌 **لازمتها إيه في الفرونت إند:**\n' +
      '- تُربط بزر "تحديث التحليل الآن" (Refresh Analysis) في واجهة المستخدم.\n' +
      '- تُرسل إشارة لجسر MT5 لالتقاط صورة جديدة بالثانية الحالية وإعادة تشغيل الذكاء الاصطناعي للتحليل الفني.',
  })
  @ApiParam({
    name: 'symbol',
    required: true,
    description: 'رمز الزوج المطلوب تحديثه (مثال: XAUUSD)',
    example: 'XAUUSD',
  })
  @ApiOkResponse({
    description: 'تم قبول طلب التحديث وجاري التنفيذ.',
    type: FreshSnapshotResponseDto,
  })
  async requestFreshSnapshot(
    @Param('symbol') symbol: string,
  ): Promise<FreshSnapshotResponseDto> {
    return this.analystService.requestFreshSnapshot(symbol);
  }

  @Get('state')
  @Throttle({ default: { limit: 100, ttl: 60000 } })
  @ApiOperation({
    summary: '4. حالة اتصال محرك ميتاتريدر 5 (MT5 Engine Bridge Health)',
    description:
      '📌 **لازمتها إيه في الفرونت إند:**\n' +
      '- تُستدعى لإظهار مؤشر اتصال السوق (Online/Offline) في شريط رأس الصفحة (Header Indicator).\n' +
      '- تُرجع هل منصة MT5 متصلة، وكم عدد الأزواج المفعلة وتوقيت آخر نبضة.',
  })
  @ApiOkResponse({
    description: 'حالة محرك التحليل والاتصال.',
  })
  async getEngineState() {
    return this.analystService.getEngineState();
  }
}
