import { Controller, Get, Sse, Header } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiOkResponse, ApiProduces } from '@nestjs/swagger';
import { Throttle, SkipThrottle } from '@nestjs/throttler';
import { Observable } from 'rxjs';
import { MarketService, MarketOverviewPayload } from './market.service';
import {
  MarketRatesResponseDto,
  MarketOverviewResponseDto,
} from './dto/market-response.dto';

@ApiTags('Market & Telemetry')
@Controller('market')
export class MarketController {
  constructor(private readonly marketService: MarketService) {}

  @Get('rates')
  @Throttle({ default: { limit: 120, ttl: 60000 } })
  @ApiOperation({
    summary: '1. لقطة أسعار العملات والذهب الفورية (Live Rates Snapshot)',
    description:
      '📌 **لازمتها إيه في الفرونت إند:**\n' +
      '- تُستدعى لملء شريط الأسعار المتحرك (Ticker Bar) أو كروت العملات في الواجهة الرئيسية.\n' +
      '- تُرجع أسعار العرض والطلب (Bid/Ask)، التغير اليومي بالنسبة المئوية (+1.25%)، أعلى وأدنى سعر (High/Low)، والسبريد.\n' +
      '- مفيدة في حالة التحميل الأولي للصفحة (SSR أو initial fetch) قبل فتح بث الـ SSE.\n' +
      '- لا تتطلب توكن (Public).',
  })
  @ApiOkResponse({
    description: 'تم جلب لقطة الأسعار بنجاح.',
    type: MarketRatesResponseDto,
  })
  getRates() {
    return {
      success: true,
      data: this.marketService.getLiveRates(),
      timestamp: new Date().toISOString(),
    };
  }

  @Get('overview')
  @Throttle({ default: { limit: 120, ttl: 60000 } })
  @ApiOperation({
    summary: '2. نظرة شاملة على السوق وأعلى الرابحين/الخاسرين (Market Overview & Movers)',
    description:
      '📌 **لازمتها إيه في الفرونت إند:**\n' +
      '- تُستدعى في لوحة المتابعة (Dashboard) أو صفحة السوق (Market Page).\n' +
      '- تُرجع: الأكثر صعوداً (Top Gainer)، الأكثر هبوطاً (Top Loser)، الأعلى سيولة (Highest Volume)، وحالة الجلسات (لندن/نيويورك/طوكيو) ونسب الشراء والبيع (Market Sentiment).\n' +
      '- لا تتطلب توكن (Public).',
  })
  @ApiOkResponse({
    description: 'تم احتساب مؤشرات ونظرة السوق بنجاح.',
    type: MarketOverviewResponseDto,
  })
  getOverview() {
    return {
      success: true,
      data: this.marketService.getMarketOverview(),
      timestamp: new Date().toISOString(),
    };
  }

  @Sse('rates/stream')
  @SkipThrottle()
  @ApiOperation({
    summary: '3. بث الأسعار المباشر الحي عبر السيرفر (SSE Realtime Feed)',
    description:
      '📌 **لازمتها إيه في الفرونت إند:**\n' +
      '- تُربط باستخدام `const es = new EventSource("https://core.fxengen.com/market/rates/stream")`.\n' +
      '- يقوم السيرفر بضخ التحديثات اللحظية كل 1.8 ثانية بدون الحاجة لـ Polling متكرر.\n' +
      '- تُستخدم لتحديث أرقام الأسعار بالألوان الخضراء/الحمراء فوراً وشمعات الشارت بدون إعادة تحميل الصفحة.\n' +
      '- مجانية وتعمل بسلاسة عبر HTTP/2.',
  })
  @ApiProduces('text/event-stream')
  @ApiResponse({
    status: 200,
    description: 'بث تدفقي مستمر (SSE) لأسعار السوق والسيولة.',
  })
  @Header('Content-Type', 'text/event-stream')
  @Header('Cache-Control', 'no-cache, no-transform')
  @Header('Connection', 'keep-alive')
  @Header('X-Accel-Buffering', 'no')
  streamRates(): Observable<{ data: MarketOverviewPayload }> {
    return this.marketService.streamRates();
  }
}
