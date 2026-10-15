import { Controller, Get, Post, Param, Query, HttpCode, HttpStatus, Header } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiParam } from '@nestjs/swagger';
import { AdsService } from './ads.service';
import { AdPlacement } from '@prisma/client';

@ApiTags('Public Advertisements & Tracking (إعلانات الموقع العام)')
@Controller('ads')
export class AdsController {
  constructor(private readonly adsService: AdsService) {}

  @Get('active')
  @ApiOperation({
    summary: '1. جلب الإعلانات النشطة حسب المساحة (Get Active Ads by Placement)',
    description: 'يستخدمه موقع المنصة لجلب بنرات الشريط الأيمن أو الأيسر أو الأفقي أو شريط الجوال أو كافة الإعلانات.',
  })
  @ApiQuery({ name: 'placement', required: false })
  async getActiveAds(@Query('placement') placement?: string) {
    return this.adsService.getActiveAdsByPlacement(placement);
  }

  @Get('adsense-config')
  @ApiOperation({
    summary: '2. إعدادات جوجل أدسنس للموقع (Public AdSense Config)',
    description: 'يعيد إعدادات AdSense (المعرف، التفعيل، الوحدات) ليتم تحميل السكربت في الواجهة.',
  })
  async getAdSenseConfig() {
    return this.adsService.getAdSenseConfig();
  }

  @Get('ads-txt')
  @Header('Content-Type', 'text/plain; charset=utf-8')
  @ApiOperation({
    summary: '3. ملف التوثيق المعتمد لإعلانات جوجل (ads.txt content)',
    description: 'يعيد السطر المعتمد رسمياً google.com, pub-XXXX, DIRECT, f08c47fec0942fa0 المطلوب من جوجل.',
  })
  async getAdsTxt() {
    return this.adsService.getAdsTxtContent();
  }

  @Post(':id/click')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '4. تسجيل نقرة مستخدم على الإعلان (Record Ad Click)',
    description: 'يزيد عداد النقرات clicksCount لإحصائيات التحويل والـ CTR في لوحة التحكم.',
  })
  @ApiParam({ name: 'id', description: 'معرف الإعلان' })
  async recordClick(@Param('id') id: string) {
    return this.adsService.recordClick(id);
  }

  @Post(':id/view')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '5. تسجيل ظهور الإعلان (Record Ad Impression)',
    description: 'يزيد عداد المشاهدات viewsCount عند عرض الإعلان في واجهة المستخدم.',
  })
  @ApiParam({ name: 'id', description: 'معرف الإعلان' })
  async recordView(@Param('id') id: string) {
    return this.adsService.recordView(id);
  }
}
